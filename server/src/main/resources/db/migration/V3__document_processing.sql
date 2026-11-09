ALTER TABLE document_registry
    ADD COLUMN updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    ADD COLUMN chunk_count INTEGER;

CREATE INDEX idx_document_registry_owner_id ON document_registry(owner_id);

-- Acelera os filtros por metadado (delete e busca por document_id) no pgvector
CREATE INDEX idx_vector_store_metadata ON vector_store USING GIN (metadata jsonb_path_ops);
