package br.com.igor.copilot.document.ingestion;

import java.util.UUID;

/**
 * Contrato para o pipeline de ingestão RAG (extração de texto, chunking e indexação vetorial) de documentos.
 */
public interface DocumentIngestionService {

    void ingest(UUID documentId);
}
