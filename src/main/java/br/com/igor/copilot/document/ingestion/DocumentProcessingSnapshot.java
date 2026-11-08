package br.com.igor.copilot.document.ingestion;

import java.util.UUID;

/**
 * Projeção imutável dos dados necessários para o worker processar um documento fora de transação.
 */
public record DocumentProcessingSnapshot(
        UUID id,
        UUID ownerId,
        String fileName,
        String s3Key
) {
}
