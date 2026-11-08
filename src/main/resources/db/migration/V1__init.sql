CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE users (
                       id          UUID PRIMARY KEY,
                       email       VARCHAR(255) NOT NULL UNIQUE,
                       password    VARCHAR(255) NOT NULL,
                       created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE document_registry (
                                   id             UUID PRIMARY KEY,
                                   owner_id       UUID         NOT NULL REFERENCES users(id),
                                   file_name      VARCHAR(255) NOT NULL,
                                   s3_key         VARCHAR(512) NOT NULL,
                                   status         VARCHAR(20)  NOT NULL
                                       CHECK (status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
                                   error_message  TEXT,
                                   created_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE vector_store (
                              id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                              content    TEXT,
                              metadata   JSONB,
                              embedding  VECTOR(1536)
);

CREATE INDEX idx_vector_store_embedding
    ON vector_store USING HNSW (embedding vector_cosine_ops);