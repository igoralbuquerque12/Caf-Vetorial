package br.com.igor.copilot.chat;

import org.springframework.ai.chat.prompt.PromptTemplate;

/**
 * Agrupa o texto do system prompt e o {@link PromptTemplate} de RAG já carregados e validados no boot.
 */
public record ChatPrompts(
        String systemPrompt,
        PromptTemplate ragTemplate
) {
}
