package br.com.igor.copilot.chat.dto;

/**
 * Representa um trecho do documento utilizado como fonte de contexto para a resposta do modelo.
 */
public record SourceReference(
        Integer page,
        Integer chunkIndex,
        String excerpt,
        Double score
) {
}
