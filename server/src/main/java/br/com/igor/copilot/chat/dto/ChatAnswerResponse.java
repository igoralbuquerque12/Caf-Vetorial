package br.com.igor.copilot.chat.dto;

import java.util.List;

/**
 * Resposta do endpoint de chat RAG contendo o texto gerado pelo modelo e as referências de fonte do documento.
 * <p>
 * Chama-se {@code ChatAnswerResponse} para evitar colisão de nomes com
 * {@code org.springframework.ai.chat.model.ChatResponse}.
 */
public record ChatAnswerResponse(
        String answer,
        List<SourceReference> sources
) {
}
