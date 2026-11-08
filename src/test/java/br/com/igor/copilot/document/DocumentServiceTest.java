package br.com.igor.copilot.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.document.event.DocumentUploadedEvent;
import br.com.igor.copilot.storage.StorageService;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRegistryRepository repository;

    @Mock
    private StorageService storageService;

    @Mock
    private PdfUploadValidator validator;

    @Mock
    private TransactionTemplate transactionTemplate;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    private DocumentService documentService;

    @BeforeEach
    void setUp() {
        documentService = new DocumentService(
                repository,
                storageService,
                validator,
                transactionTemplate,
                eventPublisher
        );
    }

    @Test
    void uploadShouldSaveAsPendingPublishEventAndGenerateFormattedS3Key() {
        UUID ownerId = UUID.randomUUID();
        UUID docId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "manual.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 test".getBytes(StandardCharsets.US_ASCII)
        );

        when(validator.validateAndSanitizeFileName(file)).thenReturn("manual.pdf");
        when(transactionTemplate.execute(any())).thenAnswer(inv ->
                inv.<TransactionCallback<?>>getArgument(0).doInTransaction(mock(TransactionStatus.class)));
        when(repository.save(any(DocumentRegistry.class))).thenAnswer(inv -> {
            DocumentRegistry reg = inv.getArgument(0);
            ReflectionTestUtils.setField(reg, "id", docId);
            return reg;
        });

        DocumentResponse response = documentService.upload(ownerId, file);

        ArgumentCaptor<String> s3KeyCaptor = ArgumentCaptor.forClass(String.class);
        verify(storageService).upload(s3KeyCaptor.capture(), any(), anyLong(), eq(MediaType.APPLICATION_PDF_VALUE));
        String generatedKey = s3KeyCaptor.getValue();

        ArgumentCaptor<DocumentRegistry> registryCaptor = ArgumentCaptor.forClass(DocumentRegistry.class);
        verify(repository).save(registryCaptor.capture());
        DocumentRegistry savedRegistry = registryCaptor.getValue();

        assertThat(generatedKey).matches("^documents/" + ownerId + "/[0-9a-f\\-]{36}\\.pdf$");
        assertThat(savedRegistry.getStatus()).isEqualTo(DocumentStatus.PENDING);
        assertThat(savedRegistry.getS3Key()).isEqualTo(generatedKey);
        assertThat(response.id()).isEqualTo(docId);
        assertThat(response.status()).isEqualTo(DocumentStatus.PENDING);

        verify(eventPublisher).publishEvent(new DocumentUploadedEvent(docId));
    }

    @Test
    void uploadShouldCompensateByDeletingFromS3WhenDatabaseSaveFails() {
        UUID ownerId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "manual.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "%PDF-1.7 test".getBytes(StandardCharsets.US_ASCII)
        );

        when(validator.validateAndSanitizeFileName(file)).thenReturn("manual.pdf");
        when(transactionTemplate.execute(any())).thenAnswer(inv ->
                inv.<TransactionCallback<?>>getArgument(0).doInTransaction(mock(TransactionStatus.class)));
        when(repository.save(any(DocumentRegistry.class))).thenThrow(new RuntimeException("Erro de banco simulado"));

        assertThatThrownBy(() -> documentService.upload(ownerId, file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Erro de banco simulado");

        ArgumentCaptor<String> uploadKeyCaptor = ArgumentCaptor.forClass(String.class);
        verify(storageService).upload(uploadKeyCaptor.capture(), any(), anyLong(), eq(MediaType.APPLICATION_PDF_VALUE));

        verify(storageService).delete(uploadKeyCaptor.getValue());
    }
}
