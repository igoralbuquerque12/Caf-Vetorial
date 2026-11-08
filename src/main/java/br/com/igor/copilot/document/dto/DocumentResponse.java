package br.com.igor.copilot.document.dto;

import br.com.igor.copilot.document.DocumentRegistry;
import br.com.igor.copilot.document.DocumentStatus;
import java.time.Instant;
import java.util.UUID;

/**
 * Representação pública de um documento na API, omitindo detalhes internos como {@code s3Key} e {@code ownerId}.
 */
public record DocumentResponse(
        UUID id,
        String fileName,
        DocumentStatus status,
        Integer chunkCount,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {

    public static DocumentResponse from(DocumentRegistry doc) {
        return new DocumentResponse(
                doc.getId(),
                doc.getFileName(),
                doc.getStatus(),
                doc.getChunkCount(),
                doc.getErrorMessage(),
                doc.getCreatedAt(),
                doc.getUpdatedAt()
        );
    }
}
