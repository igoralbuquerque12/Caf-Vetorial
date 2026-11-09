package br.com.igor.copilot.document;

import br.com.igor.copilot.document.ingestion.DocumentProcessingSnapshot;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gerencia as transições de estado de {@link DocumentRegistry} em transações curtas e isoladas,
 * garantindo que nenhuma conexão de banco fique retida durante chamadas externas ao S3 ou à OpenAI.
 */
@Service
public class DocumentStatusService {

    private static final Logger log = LoggerFactory.getLogger(DocumentStatusService.class);

    private final DocumentRegistryRepository repository;

    public DocumentStatusService(DocumentRegistryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Optional<DocumentProcessingSnapshot> markProcessing(UUID id) {
        Optional<DocumentRegistry> found = repository.findById(id);
        if (found.isEmpty()) {
            log.warn("Documento {} não encontrado ao iniciar processamento", id);
            return Optional.empty();
        }
        DocumentRegistry doc = found.get();
        if (doc.isCompleted()) {
            log.info("Documento {} já consta como COMPLETED; mensagem duplicada ignorada", id);
            return Optional.empty();
        }
        doc.startProcessing();
        return Optional.of(new DocumentProcessingSnapshot(
                doc.getId(),
                doc.getOwnerId(),
                doc.getFileName(),
                doc.getS3Key()
        ));
    }

    @Transactional
    public void markCompleted(UUID id, int chunkCount) {
        DocumentRegistry doc = repository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        doc.complete(chunkCount);
    }

    /**
     * Marca o documento como {@link DocumentStatus#FAILED}.
     * <p>
     * Utiliza {@link Propagation#REQUIRES_NEW} porque este método também pode ser invocado a partir de
     * um listener {@code @TransactionalEventListener(phase = AFTER_COMMIT)} (quando falha o envio ao RabbitMQ).
     * Como na fase {@code AFTER_COMMIT} a transação original já foi finalizada mas os recursos de sincronização
     * ainda estão ativos na thread, o Spring exige uma nova transação física para persistir o estado de falha.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markFailed(UUID id, String message) {
        repository.findById(id).ifPresent(doc -> doc.fail(message));
    }
}
