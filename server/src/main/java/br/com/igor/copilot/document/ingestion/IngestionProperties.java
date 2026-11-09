package br.com.igor.copilot.document.ingestion;

import jakarta.validation.constraints.Positive;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas para parametrização do particionamento de texto (chunking) na ingestão RAG.
 */
@Validated
@ConfigurationProperties(prefix = "app.ingestion")
public record IngestionProperties(
        @Positive(message = "O tamanho do chunk em tokens deve ser positivo")
        int chunkSize,

        @Positive(message = "O tamanho mínimo do chunk em caracteres deve ser positivo")
        int minChunkSizeChars
) {
}
