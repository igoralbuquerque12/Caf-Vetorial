package br.com.igor.copilot.document.event;

import br.com.igor.copilot.document.messaging.DocumentQueuePublisher;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Escuta o evento {@link DocumentUploadedEvent} após o commit da transação do banco de dados
 * para impedir que o worker consuma a mensagem antes de o registro existir na tabela {@code document_registry}.
 */
@Component
public class DocumentUploadedEventListener {

    private final DocumentQueuePublisher publisher;

    public DocumentUploadedEventListener(DocumentQueuePublisher publisher) {
        this.publisher = publisher;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        publisher.publish(event.documentId());
    }
}
