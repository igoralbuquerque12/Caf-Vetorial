package br.com.igor.copilot.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

/**
 * Dados de entrada para realização de uma pergunta sobre um documento específico no chat RAG.
 */
public record AskQuestionRequest(
        @NotBlank(message = "A pergunta é obrigatória")
        @Size(max = 2000, message = "A pergunta deve ter no máximo 2000 caracteres")
        String question,

        @NotNull(message = "O documentId é obrigatório")
        UUID documentId
) {
}
