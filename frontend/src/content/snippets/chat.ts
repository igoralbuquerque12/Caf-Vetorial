import type { Snippet } from '../../flows/types'

export const chatController: Snippet = {
  language: 'java',
  code: `@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ChatAnswerResponse ask(
            @RequestBody @Valid AskQuestionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return chatService.ask(CurrentUser.id(jwt), request);
    }
}`,
  highlight: [11, 16],
}

export const askQuestionRequest: Snippet = {
  language: 'java',
  code: `public record AskQuestionRequest(
        @NotBlank(message = "A pergunta é obrigatória")
        @Size(max = 2000, message = "A pergunta deve ter no máximo 2000 caracteres")
        String question,

        @NotNull(message = "O documentId é obrigatório")
        UUID documentId
) {
}`,
  highlight: [2, 3],
}

export const chatServiceAsk: Snippet = {
  language: 'java',
  code: `// Sem @Transactional: não segura conexão do banco durante a chamada à OpenAI.
public ChatAnswerResponse ask(UUID userId, AskQuestionRequest request) {
    DocumentResponse document = documentService.findById(request.documentId(), userId);
    if (document.status() != DocumentStatus.COMPLETED) {
        throw new DocumentNotReadyException(document.status());
    }

    String filter = "%s == '%s' && %s == '%s'".formatted(
            VectorMetadata.DOCUMENT_ID, request.documentId(),
            VectorMetadata.OWNER_ID, userId);

    ChatResponse response = chatClient.prompt()
            .user(request.question())
            .advisors(questionAnswerAdvisor)
            .advisors(a -> a.param(QuestionAnswerAdvisor.FILTER_EXPRESSION, filter))
            .call()
            .chatResponse();

    return new ChatAnswerResponse(extractAnswer(response), extractSources(response));
}`,
  highlight: [7, 16],
}

export const chatFindDocument: Snippet = {
  language: 'java',
  code: `DocumentResponse document = documentService.findById(request.documentId(), userId);
// findById consulta WHERE id = ? AND owner_id = ?:
// se o documento é de outro usuário, o resultado é o mesmo de "não existe" (404).`,
  highlight: [1, 1],
}

export const chatStatusCheck: Snippet = {
  language: 'java',
  code: `if (document.status() != DocumentStatus.COMPLETED) {
    throw new DocumentNotReadyException(document.status());
}

// No GlobalExceptionHandler: 409 + propriedade "documentStatus"
public class DocumentNotReadyException extends RuntimeException {
    private final DocumentStatus status;

    public DocumentNotReadyException(DocumentStatus status) {
        super("O documento ainda não está pronto para perguntas (status: %s)".formatted(status));
        this.status = status;
    }
}`,
  highlight: [1, 3],
}

export const chatConfigClient: Snippet = {
  language: 'java',
  code: `@Configuration
public class ChatConfig {

    @Bean
    public ChatPrompts chatPrompts(ChatPromptsLoader loader, ChatProperties props) {
        return loader.load(props); // lê e valida os prompts no boot
    }

    @Bean
    public ChatClient documentChatClient(ChatClient.Builder builder, ChatPrompts prompts) {
        return builder.defaultSystem(prompts.systemPrompt()).build();
    }
}`,
  highlight: [9, 12],
}

export const chatAdvisor: Snippet = {
  language: 'java',
  code: `@Bean
public QuestionAnswerAdvisor questionAnswerAdvisor(
        VectorStore vectorStore, ChatProperties props, ChatPrompts prompts) {
    return QuestionAnswerAdvisor.builder(vectorStore)
            .searchRequest(SearchRequest.builder()
                    .topK(props.topK())                                 // 5
                    .similarityThreshold(props.similarityThreshold())   // 0.3
                    .build())
            .promptTemplate(prompts.ragTemplate())
            .build();
}

// Um Advisor é como um Interceptor do Nest: roda antes da chamada ao LLM
// (busca os trechos e monta o prompt) e depois (anexa os documentos recuperados).`,
  highlight: [4, 9],
}

export const chatPgVectorSearch: Snippet = {
  language: 'sql',
  code: `-- O que o PgVectorStore executa por baixo (simplificado):
SELECT id, content, metadata,
       embedding <=> :query_embedding AS distance   -- distância de cosseno
FROM vector_store
WHERE metadata @@ '$.document_id == "..." && $.owner_id == "..."'
ORDER BY embedding <=> :query_embedding
LIMIT 5;                                            -- topK

-- Depois, o Spring AI descarta o que tem similaridade abaixo do limiar (0.3).`,
  highlight: [5, 5],
}

export const chatRagTemplate: Snippet = {
  language: 'java',
  code: `// ChatPromptsLoader valida o template no boot:
private void validateRagPrompt(String content, Resource resource) {
    if (!content.contains("{query}")) {
        throw new IllegalStateException(
            "O template de RAG em " + resource.getDescription()
            + " deve conter o marcador obrigatório {query}");
    }
    if (!content.contains("{question_answer_context}")) {
        throw new IllegalStateException(
            "O template de RAG em " + resource.getDescription()
            + " deve conter o marcador obrigatório {question_answer_context}");
    }
}`,
  highlight: [3, 3],
}

export const chatModelCall: Snippet = {
  language: 'yaml',
  code: `spring:
  ai:
    retry:
      max-attempts: 3
      backoff:
        initial-interval: 2s
        multiplier: 2
        max-interval: 10s
    openai:
      chat:
        options:
          model: gpt-4o-mini
          temperature: 0.2`,
  highlight: [3, 7],
}

export const chatSources: Snippet = {
  language: 'java',
  code: `private List<SourceReference> extractSources(ChatResponse response) {
    List<Document> retrieved =
            response.getMetadata().get(QuestionAnswerAdvisor.RETRIEVED_DOCUMENTS);
    if (retrieved == null || retrieved.isEmpty()) {
        return List.of();
    }
    return retrieved.stream().map(this::toSourceReference).toList();
}

private SourceReference toSourceReference(Document doc) {
    Map<String, Object> metadata = doc.getMetadata();
    Integer page = toInteger(metadata.get(PagePdfDocumentReader.METADATA_START_PAGE_NUMBER));
    Integer chunkIndex = toInteger(metadata.get(VectorMetadata.CHUNK_INDEX));
    return new SourceReference(page, chunkIndex, formatExcerpt(doc.getText()), doc.getScore());
}

// formatExcerpt corta em 240 caracteres: é por isso que a API devolve só o começo do trecho.`,
  highlight: [10, 13],
}

export const aiHandlerChat: Snippet = {
  language: 'java',
  code: `@ExceptionHandler({NonTransientAiException.class, TransientAiException.class})
public ProblemDetail handleAiFailure(RuntimeException ex) {
    log.error("Falha ao chamar o provedor de IA", ex);
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY,
        "O serviço de IA está indisponível. Tente novamente em instantes.");
}
// Antes de chegar aqui, o spring.ai.retry já tentou 3 vezes com backoff (2s, 4s...).`,
  highlight: [1, 5],
}
