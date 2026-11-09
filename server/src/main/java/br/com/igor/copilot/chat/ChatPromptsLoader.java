package br.com.igor.copilot.chat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Carrega e valida os arquivos de system prompt e template de RAG durante a inicialização da aplicação.
 * <p>
 * Aplica o princípio de <i>fail fast</i>: caso qualquer arquivo esteja ausente, em branco, contenha chaves
 * não permitidas no system prompt ou omita marcadores obrigatórios ({@code {query}} e {@code {question_answer_context}})
 * no template de RAG, a aplicação falha imediatamente no boot com uma mensagem explícita, em vez de quebrar
 * em produção apenas quando um cliente enviar a primeira pergunta.
 */
@Component
public class ChatPromptsLoader {

    private static final Logger log = LoggerFactory.getLogger(ChatPromptsLoader.class);
    private static final String QUERY_PLACEHOLDER = "{query}";
    private static final String CONTEXT_PLACEHOLDER = "{question_answer_context}";

    public ChatPrompts load(ChatProperties props) {
        String systemPrompt = readResource(props.systemPrompt());
        validateSystemPrompt(systemPrompt, props.systemPrompt());

        String ragPromptText = readResource(props.ragPrompt());
        validateRagPrompt(ragPromptText, props.ragPrompt());

        log.info(
                "Prompts de chat carregados com sucesso (systemPrompt={}, ragPrompt={})",
                props.systemPrompt().getDescription(),
                props.ragPrompt().getDescription()
        );

        return new ChatPrompts(systemPrompt.trim(), new PromptTemplate(ragPromptText));
    }

    private String readResource(Resource resource) {
        if (resource == null || !resource.exists()) {
            String desc = resource != null ? resource.getDescription() : "null";
            throw new IllegalStateException("Não foi possível ler o prompt em " + desc);
        }
        try {
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Não foi possível ler o prompt em " + resource.getDescription(), e);
        }
    }

    private void validateSystemPrompt(String content, Resource resource) {
        if (!StringUtils.hasText(content)) {
            throw new IllegalStateException(
                    "O system prompt está em branco em " + resource.getDescription()
            );
        }
        if (content.contains("{") || content.contains("}")) {
            throw new IllegalStateException(
                    "O system prompt em " + resource.getDescription()
                            + " não pode conter chaves '{' ou '}', pois elas são interpretadas como variáveis de template pelo Spring AI"
            );
        }
    }

    private void validateRagPrompt(String content, Resource resource) {
        if (!StringUtils.hasText(content)) {
            throw new IllegalStateException(
                    "O template de RAG está em branco em " + resource.getDescription()
            );
        }
        if (!content.contains(QUERY_PLACEHOLDER)) {
            throw new IllegalStateException(
                    "O template de RAG em " + resource.getDescription()
                            + " deve conter o marcador obrigatório " + QUERY_PLACEHOLDER
            );
        }
        if (!content.contains(CONTEXT_PLACEHOLDER)) {
            throw new IllegalStateException(
                    "O template de RAG em " + resource.getDescription()
                            + " deve conter o marcador obrigatório " + CONTEXT_PLACEHOLDER
            );
        }
    }
}
