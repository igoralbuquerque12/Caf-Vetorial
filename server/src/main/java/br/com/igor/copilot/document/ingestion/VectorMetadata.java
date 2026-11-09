package br.com.igor.copilot.document.ingestion;

/**
 * Constantes de chaves de metadados armazenadas no JSONB da tabela {@code vector_store}
 * e utilizadas nos filtros de exclusão e busca semântica por documento/usuário.
 */
public final class VectorMetadata {

    public static final String DOCUMENT_ID = "document_id";
    public static final String OWNER_ID = "owner_id";
    public static final String CHUNK_INDEX = "chunk_index";

    private VectorMetadata() {
    }
}
