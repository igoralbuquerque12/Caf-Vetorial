package br.com.igor.copilot.document.ingestion;

import br.com.igor.copilot.document.DocumentStatusService;
import br.com.igor.copilot.storage.StorageService;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * Implementação do pipeline de ingestão RAG para arquivos PDF.
 * <p>
 * Realiza o download do PDF no S3, extrai texto página a página, divide em chunks, enriquece os metadados
 * de posse ({@code document_id}, {@code owner_id}, {@code chunk_index}) e grava os embeddings no {@link VectorStore}
 * de forma idempotente.
 */
@Service
public class PdfDocumentIngestionService implements DocumentIngestionService {

    private static final Logger log = LoggerFactory.getLogger(PdfDocumentIngestionService.class);

    private final DocumentStatusService statusService;
    private final StorageService storageService;
    private final VectorStore vectorStore;
    private final TokenTextSplitter textSplitter;

    public PdfDocumentIngestionService(
            DocumentStatusService statusService,
            StorageService storageService,
            VectorStore vectorStore,
            TokenTextSplitter textSplitter
    ) {
        this.statusService = statusService;
        this.storageService = storageService;
        this.vectorStore = vectorStore;
        this.textSplitter = textSplitter;
    }

    @Override
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
            vectorStore.delete(byDocumentId(documentId));
            vectorStore.add(chunks);
            statusService.markCompleted(documentId, chunks.size());
        } catch (RuntimeException e) {
            deleteVectorsQuietly(documentId);
            throw e;
        }
    }

    /**
     * Lê as páginas do PDF que possuem texto extraível.
     * <p>
     * Criamos uma subclasse anônima de {@link ByteArrayResource} sobrescrevendo {@code getFilename()}
     * porque o {@link PagePdfDocumentReader} insere o nome do recurso nos metadados do {@link Document},
     * e o {@link Document} do Spring AI rejeita valores nulos no mapa de metadados (um {@link ByteArrayResource}
     * padrão retorna {@code null} em {@code getFilename()}).
     */
    private List<Document> readNonBlankPages(byte[] pdf, String fileName) {
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

    private List<Document> withMetadata(List<Document> chunks, DocumentProcessingSnapshot doc) {
        List<Document> enriched = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            Document chunk = chunks.get(i);
            Map<String, Object> metadataCombinado = new HashMap<>(chunk.getMetadata());
            metadataCombinado.put(VectorMetadata.DOCUMENT_ID, doc.id().toString());
            metadataCombinado.put(VectorMetadata.OWNER_ID, doc.ownerId().toString());
            metadataCombinado.put(VectorMetadata.CHUNK_INDEX, i);
            enriched.add(Document.builder()
                    .text(chunk.getText())
                    .metadata(metadataCombinado)
                    .build());
        }
        return enriched;
    }

    private Filter.Expression byDocumentId(UUID id) {
        return new FilterExpressionBuilder().eq(VectorMetadata.DOCUMENT_ID, id.toString()).build();
    }

    private void deleteVectorsQuietly(UUID id) {
        try {
            vectorStore.delete(byDocumentId(id));
        } catch (RuntimeException e) {
            log.warn("Falha ao limpar vetores parciais do documento {}", id, e);
        }
    }
}
