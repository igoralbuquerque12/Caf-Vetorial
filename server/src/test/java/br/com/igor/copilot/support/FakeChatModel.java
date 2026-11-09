package br.com.igor.copilot.support;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.retry.NonTransientAiException;

/**
 * Implementação de {@link ChatModel} em memória para testes de integração, capturando o último {@link Prompt}
 * enviado pelo {@code ChatClient} e permitindo simular falhas do provedor de IA.
 */
public class FakeChatModel implements ChatModel {

    public static final String DEFAULT_ANSWER = "Resposta simulada do copilot";

    private final AtomicReference<Prompt> lastPrompt = new AtomicReference<>();
    private final AtomicBoolean failNextCall = new AtomicBoolean(false);

    @Override
    public ChatResponse call(Prompt prompt) {
        lastPrompt.set(prompt);
        if (failNextCall.compareAndSet(true, false)) {
            throw new NonTransientAiException("falha simulada");
        }
        return new ChatResponse(List.of(new Generation(new AssistantMessage(DEFAULT_ANSWER))));
    }

    public Prompt lastPrompt() {
        return lastPrompt.get();
    }

    public void failNextCall() {
        failNextCall.set(true);
    }

    public void reset() {
        lastPrompt.set(null);
        failNextCall.set(false);
    }
}
