package br.com.igor.copilot.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;

class ChatPromptsLoaderTest {

    private static final String VALID_SYSTEM_PROMPT = "Você é o Copilot de Previdência.";
    private static final String VALID_RAG_PROMPT = "Pergunta: {query}\nContexto:\n{question_answer_context}";

    private ChatPromptsLoader loader;

    @BeforeEach
    void setUp() {
        loader = new ChatPromptsLoader();
    }

    private Resource resourceOf(String content) {
        return new ByteArrayResource(content.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void shouldLoadValidPromptsSuccessfully() {
        ChatProperties props = new ChatProperties(
                resourceOf(VALID_SYSTEM_PROMPT),
                resourceOf(VALID_RAG_PROMPT),
                5,
                0.3
        );

        ChatPrompts prompts = loader.load(props);

        assertThat(prompts.systemPrompt()).isEqualTo(VALID_SYSTEM_PROMPT);
        assertThat(prompts.ragTemplate()).isNotNull();
    }

    @Test
    void shouldFailWhenSystemPromptContainsCurlyBraces() {
        ChatProperties props = new ChatProperties(
                resourceOf("Prompt inválido com {variavel}"),
                resourceOf(VALID_RAG_PROMPT),
                5,
                0.3
        );

        assertThatThrownBy(() -> loader.load(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("chaves");
    }

    @Test
    void shouldFailWhenSystemPromptIsBlank() {
        ChatProperties props = new ChatProperties(
                resourceOf("   \n\t  "),
                resourceOf(VALID_RAG_PROMPT),
                5,
                0.3
        );

        assertThatThrownBy(() -> loader.load(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("em branco");
    }

    @Test
    void shouldFailWhenRagPromptIsMissingQueryPlaceholder() {
        ChatProperties props = new ChatProperties(
                resourceOf(VALID_SYSTEM_PROMPT),
                resourceOf("Apenas contexto: {question_answer_context}"),
                5,
                0.3
        );

        assertThatThrownBy(() -> loader.load(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("{query}");
    }

    @Test
    void shouldFailWhenRagPromptIsMissingContextPlaceholder() {
        ChatProperties props = new ChatProperties(
                resourceOf(VALID_SYSTEM_PROMPT),
                resourceOf("Apenas pergunta: {query}"),
                5,
                0.3
        );

        assertThatThrownBy(() -> loader.load(props))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("{question_answer_context}");
    }
}
