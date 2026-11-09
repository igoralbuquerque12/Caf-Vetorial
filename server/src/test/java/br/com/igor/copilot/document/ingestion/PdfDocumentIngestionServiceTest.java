package br.com.igor.copilot.document.ingestion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.igor.copilot.document.DocumentStatusService;
import br.com.igor.copilot.storage.StorageService;
import br.com.igor.copilot.support.TestPdfs;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.Filter;

@ExtendWith(MockitoExtension.class)
class PdfDocumentIngestionServiceTest {

    @Mock
    private DocumentStatusService statusService;

    @Mock
    private StorageService storageService;

    @Mock
    private VectorStore vectorStore;

    private PdfDocumentIngestionService ingestionService;

    @BeforeEach
    void setUp() {
        TokenTextSplitter textSplitter = TokenTextSplitter.builder()
                .withChunkSize(800)
                .withMinChunkSizeChars(350)
                .withMinChunkLengthToEmbed(5)
                .withMaxNumChunks(10000)
                .withKeepSeparator(true)
                .build();
        ingestionService = new PdfDocumentIngestionService(
                statusService,
                storageService,
                vectorStore,
                textSplitter
        );
    }

    @Test
    @SuppressWarnings("unchecked")
    void ingestShouldExtractPagesEnrichMetadataDeleteBeforeAddAndMarkCompleted() {
        UUID docId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        DocumentProcessingSnapshot snapshot = new DocumentProcessingSnapshot(
                docId,
                ownerId,
                "regulamento.pdf",
                "documents/" + ownerId + "/" + docId + ".pdf"
        );

        byte[] pdfBytes = TestPdfs.withText(
                "Conteudo completo da pagina um do regulamento oficial.",
                "Conteudo completo da pagina dois com regras adicionais."
        );

        when(statusService.markProcessing(docId)).thenReturn(Optional.of(snapshot));
        when(storageService.download(snapshot.s3Key())).thenReturn(pdfBytes);

        ingestionService.ingest(docId);

        InOrder inOrder = inOrder(vectorStore, statusService);
        ArgumentCaptor<List<Document>> chunksCaptor = ArgumentCaptor.forClass(List.class);
        inOrder.verify(vectorStore).delete(any(Filter.Expression.class));
        inOrder.verify(vectorStore).add(chunksCaptor.capture());

        List<Document> addedChunks = chunksCaptor.getValue();
        assertThat(addedChunks).hasSize(2);
        inOrder.verify(statusService).markCompleted(docId, addedChunks.size());

        for (int i = 0; i < addedChunks.size(); i++) {
            Document chunk = addedChunks.get(i);
            assertThat(chunk.getMetadata())
                    .containsEntry(VectorMetadata.DOCUMENT_ID, docId.toString())
                    .containsEntry(VectorMetadata.OWNER_ID, ownerId.toString())
                    .containsEntry(VectorMetadata.CHUNK_INDEX, i)
                    .containsKey(PagePdfDocumentReader.METADATA_START_PAGE_NUMBER);
        }
    }

    @Test
    void ingestShouldDoNothingWhenSnapshotIsEmpty() {
        UUID docId = UUID.randomUUID();
        when(statusService.markProcessing(docId)).thenReturn(Optional.empty());

        ingestionService.ingest(docId);

        verifyNoInteractions(storageService, vectorStore);
        verify(statusService, never()).markCompleted(any(), any(Integer.class));
    }

    @Test
    void ingestShouldThrowUnprocessableDocumentExceptionAndCleanVectorsOnBlankPdf() {
        UUID docId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        DocumentProcessingSnapshot snapshot = new DocumentProcessingSnapshot(
                docId,
                ownerId,
                "vazio.pdf",
                "documents/" + ownerId + "/" + docId + ".pdf"
        );

        when(statusService.markProcessing(docId)).thenReturn(Optional.of(snapshot));
        when(storageService.download(snapshot.s3Key())).thenReturn(TestPdfs.blankPage());

        assertThatThrownBy(() -> ingestionService.ingest(docId))
                .isInstanceOf(UnprocessableDocumentException.class)
                .hasMessageContaining("OCR");

        verify(vectorStore).delete(any(Filter.Expression.class));
        verify(vectorStore, never()).add(any());
        verify(statusService, never()).markCompleted(any(), any(Integer.class));
    }
}
