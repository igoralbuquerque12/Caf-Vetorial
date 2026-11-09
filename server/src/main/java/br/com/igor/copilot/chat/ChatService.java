package br.com.igor.copilot.chat;

import br.com.igor.copilot.chat.dto.AskQuestionRequest;
import br.com.igor.copilot.chat.dto.ChatAnswerResponse;
import br.com.igor.copilot.chat.dto.SourceReference;
import br.com.igor.copilot.document.DocumentService;
import br.com.igor.copilot.document.DocumentStatus;
import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.document.ingestion.VectorMetadata;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Serviço responsável pelo fluxo de perguntas e respostas (RAG) sobre documentos do usuário.
 * <ul>
 *   <li><b>Sem {@code @Transactional}:</b> este serviço não abre transação de banco de dados para não reter
 *       uma conexão JDBC do pool durante a chamada HTTP de geração de resposta na OpenAI.</li>
 *   <li><b>Defesa em profundidade no filtro vetorial:</b> além de validar a posse do documento no PostgreSQL
 *       via {@link DocumentService#findById(UUID, UUID)}, restringimos a busca no {@code VectorStore} tanto por
 *       {@code document_id} quanto por {@code owner_id}. Como ambos os valores são objetos {@link UUID} já
 *       tipados e validados, não há risco de injeção na expressão de filtro.</li>
 *   <li><b>Privacidade (LGPD):</b> o log de auditoria registra apenas contadores de tokens e latência,
 *       jamais o conteúdo da pergunta ou da resposta.</li>
 * </ul>
 */
@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);
    private static final int MAX_EXCERPT_LENGTH = 240;

    private final DocumentService documentService;
    private final ChatClient chatClient;
    private final QuestionAnswerAdvisor questionAnswerAdvisor;
    private final Clock clock;

    public ChatService(
            DocumentService documentService,
            ChatClient chatClient,
            QuestionAnswerAdvisor questionAnswerAdvisor,
            Clock clock
    ) {
        this.documentService = documentService;
        this.chatClient = chatClient;
        this.questionAnswerAdvisor = questionAnswerAdvisor;
        this.clock = clock;
    }

    public ChatAnswerResponse ask(UUID userId, AskQuestionRequest request) {
        DocumentResponse document = documentService.findById(request.documentId(), userId);
        if (document.status() != DocumentStatus.COMPLETED) {
            throw new DocumentNotReadyException(document.status());
        }

        String filter = "%s == '%s' && %s == '%s'".formatted(
                VectorMetadata.DOCUMENT_ID, request.documentId(),
                VectorMetadata.OWNER_ID, userId
        );

        Instant start = clock.instant();
        ChatResponse response = chatClient.prompt()
                .user(request.question())
                .advisors(questionAnswerAdvisor)
                .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, filter))
                .call()
                .chatResponse();

        logUsage(request.documentId(), response, Duration.between(start, clock.instant()));
        return new ChatAnswerResponse(extractAnswer(response), extractSources(response));
    }

    private String extractAnswer(ChatResponse response) {
        if (response == null || response.getResult() == null || response.getResult().getOutput() == null) {
            throw new IllegalStateException("Resposta vazia do modelo");
        }
        String text = response.getResult().getOutput().getText();
        if (!StringUtils.hasText(text)) {
            throw new IllegalStateException("Resposta vazia do modelo");
        }
        return text;
    }

    private List<SourceReference> extractSources(ChatResponse response) {
        if (response.getMetadata() == null) {
            return List.of();
        }
        List<Document> retrieved = response.getMetadata().get(QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS);
        if (retrieved == null || retrieved.isEmpty()) {
            return List.of();
        }
        return retrieved.stream()
                .map(this::toSourceReference)
                .toList();
    }

    private SourceReference toSourceReference(Document doc) {
        Map<String, Object> metadata = doc.getMetadata();
        Integer page = toInteger(metadata.get(PagePdfDocumentReader.METADATA_START_PAGE_NUMBER));
        Integer chunkIndex = toInteger(metadata.get(VectorMetadata.CHUNK_INDEX));
        String excerpt = formatExcerpt(doc.getText());
        return new SourceReference(page, chunkIndex, excerpt, doc.getScore());
    }

    private Integer toInteger(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    private String formatExcerpt(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = text.replaceAll("\\s+", " ").trim();
        if (trimmed.length() <= MAX_EXCERPT_LENGTH) {
            return trimmed;
        }
        return trimmed.substring(0, MAX_EXCERPT_LENGTH) + "…";
    }

    private void logUsage(UUID documentId, ChatResponse response, Duration latency) {
        Usage usage = response.getMetadata() != null ? response.getMetadata().getUsage() : null;
        Integer promptTokens = usage != null ? usage.getPromptTokens() : null;
        Integer completionTokens = usage != null ? usage.getCompletionTokens() : null;
        log.info(
                "Chat RAG concluído para documento {}: promptTokens={}, completionTokens={}, latencyMs={}",
                documentId,
                promptTokens,
                completionTokens,
                latency.toMillis()
        );
    }
}
