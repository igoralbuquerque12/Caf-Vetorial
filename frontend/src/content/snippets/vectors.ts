import type { Snippet } from '../../flows/types'

export const ingestionIngest: Snippet = {
  language: 'java',
  code: `@Override
public void ingest(UUID documentId) {
    Optional<DocumentProcessingSnapshot> snapshot = statusService.markProcessing(documentId);
    if (snapshot.isEmpty()) {
        return;
    }
    DocumentProcessingSnapshot doc = snapshot.get();
    try {
        byte[] pdf = storageService.download(doc.s3Key());
        List<Document> pages = readNonBlankPages(pdf, doc.fileName());
        if (pages.isEmpty()) {
            throw new UnprocessableDocumentException(
                "Não foi possível extrair texto do PDF. Ele pode ser digitalizado (imagem) e exigiria OCR.");
        }
        List<Document> chunks = withMetadata(textSplitter.apply(pages), doc);
        vectorStore.delete(byDocumentId(documentId)); // idempotência: limpa antes de inserir
        vectorStore.add(chunks);                      // embeddings (OpenAI) + INSERT
        statusService.markCompleted(documentId, chunks.size());
    } catch (RuntimeException e) {
        deleteVectorsQuietly(documentId);
        throw e;
    }
}`,
  highlight: [14, 17],
}

export const pdfReader: Snippet = {
  language: 'java',
  code: `private List<Document> readNonBlankPages(byte[] pdf, String fileName) {
    Resource resource = new ByteArrayResource(pdf) {
        @Override
        public String getFilename() {
            return fileName;
        }
    };
    return new PagePdfDocumentReader(resource).get().stream()
            .filter(page -> StringUtils.hasText(page.getText()))
            .toList();
}
// Um Document por página. Páginas sem texto (imagens) são descartadas.`,
  highlight: [8, 10],
}

export const textSplitterConfig: Snippet = {
  language: 'java',
  code: `@Bean
public TokenTextSplitter tokenTextSplitter(IngestionProperties props) {
    return TokenTextSplitter.builder()
            .withChunkSize(props.chunkSize())               // 800 tokens
            .withMinChunkSizeChars(props.minChunkSizeChars()) // 350 caracteres
            .withMinChunkLengthToEmbed(5)
            .withMaxNumChunks(10000)
            .withKeepSeparator(true)
            .build();
}`,
  highlight: [4, 5],
}

export const withMetadata: Snippet = {
  language: 'java',
  code: `private List<Document> withMetadata(List<Document> chunks, DocumentProcessingSnapshot doc) {
    List<Document> enriched = new ArrayList<>(chunks.size());
    for (int i = 0; i < chunks.size(); i++) {
        Document chunk = chunks.get(i);
        Map<String, Object> metadata = new HashMap<>(chunk.getMetadata());
        metadata.put(VectorMetadata.DOCUMENT_ID, doc.id().toString());
        metadata.put(VectorMetadata.OWNER_ID, doc.ownerId().toString());
        metadata.put(VectorMetadata.CHUNK_INDEX, i);
        enriched.add(Document.builder().text(chunk.getText()).metadata(metadata).build());
    }
    return enriched;
}`,
  highlight: [6, 8],
}

export const vectorDelete: Snippet = {
  language: 'java',
  code: `private Filter.Expression byDocumentId(UUID id) {
    return new FilterExpressionBuilder()
            .eq(VectorMetadata.DOCUMENT_ID, id.toString())
            .build();
}

// Reprocessar o mesmo documento (mensagem repetida) apaga os vetores antigos
// antes de inserir os novos: o resultado final é o mesmo (idempotente).
vectorStore.delete(byDocumentId(documentId));`,
  highlight: [8, 8],
}

export const vectorTableSql: Snippet = {
  language: 'sql',
  code: `CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE vector_store (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content    TEXT,
    metadata   JSONB,
    embedding  VECTOR(1536)   -- text-embedding-3-small
);

-- Índice aproximado para busca por similaridade de cosseno
CREATE INDEX idx_vector_store_embedding
    ON vector_store USING HNSW (embedding vector_cosine_ops);

-- Acelera os filtros por metadado (delete e busca por document_id)
CREATE INDEX idx_vector_store_metadata
    ON vector_store USING GIN (metadata jsonb_path_ops);`,
  highlight: [10, 15],
}

export const vectorIndexesSql: Snippet = vectorTableSql

export const vectorAdd: Snippet = {
  language: 'java',
  code: `// vectorStore.add(chunks) faz, para cada lote de chunks:
//   1. chama a OpenAI (text-embedding-3-small) -> float[1536] por chunk
//   2. INSERT INTO vector_store (id, content, metadata, embedding) VALUES (...)
vectorStore.add(chunks);

// application.yml:
// spring.ai.vectorstore.pgvector:
//   index-type: HNSW
//   distance-type: COSINE_DISTANCE
//   dimensions: 1536`,
  highlight: [4, 4],
}
