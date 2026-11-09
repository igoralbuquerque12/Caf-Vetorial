package br.com.igor.copilot.document.messaging;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;

import br.com.igor.copilot.document.DocumentStatusService;
import br.com.igor.copilot.document.ingestion.DocumentIngestionService;
import br.com.igor.copilot.document.ingestion.UnprocessableDocumentException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

@ExtendWith(MockitoExtension.class)
class DocumentProcessingListenerTest {

    @Mock
    private DocumentIngestionService ingestionService;

    @Mock
    private DocumentStatusService statusService;

    private DocumentProcessingListener listener;

    @BeforeEach
    void setUp() {
        listener = new DocumentProcessingListener(ingestionService, statusService);
    }

    @Test
    void onMessageShouldMarkFailedAndAckWhenUnprocessableDocumentExceptionOccurs() {
        UUID docId = UUID.randomUUID();
        doThrow(new UnprocessableDocumentException("PDF sem texto extraível"))
                .when(ingestionService).ingest(docId);

        assertThatCode(() -> listener.onMessage(new DocumentProcessingMessage(docId)))
                .doesNotThrowAnyException();

        verify(statusService).markFailed(docId, "PDF sem texto extraível");
    }

    @Test
    void onMessageShouldMarkFailedAndThrowAmqpRejectAndDontRequeueOnUnexpectedRuntimeException() {
        UUID docId = UUID.randomUUID();
        doThrow(new RuntimeException("Erro inesperado de I/O"))
                .when(ingestionService).ingest(docId);

        assertThatThrownBy(() -> listener.onMessage(new DocumentProcessingMessage(docId)))
                .isInstanceOf(AmqpRejectAndDontRequeueException.class);

        verify(statusService).markFailed(docId, "Falha ao processar o documento. Tente enviar novamente.");
    }
}
