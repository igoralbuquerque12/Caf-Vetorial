package br.com.igor.copilot.document;

import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.document.event.DocumentUploadedEvent;
import br.com.igor.copilot.storage.StorageException;
import br.com.igor.copilot.storage.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

/**
 * Serviço de aplicação para upload, compensação e consulta de documentos.
 * <ul>
 *   <li><b>Upload fora de transação:</b> o envio do arquivo para o S3 ocorre antes de abrir transação no banco,
 *       evitando segurar uma conexão do pool JDBC durante I/O de rede.</li>
 *   <li><b>Uso de {@link TransactionTemplate}:</b> como o método {@link #upload} inicia sem transação, usamos
 *       {@link TransactionTemplate} programático para envolver apenas o {@code save} e a publicação do evento,
 *       já que uma chamada interna ({@code this.metodo()}) ignoraria {@code @Transactional} devido ao proxy
 *       do Spring (<i>self-invocation</i>).</li>
 *   <li><b>Compensação no S3:</b> caso a gravação no banco falhe após o upload no S3, removemos o objeto recém-enviado
 *       para não deixar arquivos órfãos no bucket.</li>
 * </ul>
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    private final DocumentRegistryRepository repository;
    private final StorageService storageService;
    private final PdfUploadValidator validator;
    private final TransactionTemplate transactionTemplate;
    private final ApplicationEventPublisher eventPublisher;

    public DocumentService(
            DocumentRegistryRepository repository,
            StorageService storageService,
            PdfUploadValidator validator,
            TransactionTemplate transactionTemplate,
            ApplicationEventPublisher eventPublisher
    ) {
        this.repository = repository;
        this.storageService = storageService;
        this.validator = validator;
        this.transactionTemplate = transactionTemplate;
        this.eventPublisher = eventPublisher;
    }

    public DocumentResponse upload(UUID ownerId, MultipartFile file) {
        String fileName = validator.validateAndSanitizeFileName(file);
        String s3Key = "documents/%s/%s.pdf".formatted(ownerId, UUID.randomUUID());

        try (InputStream in = file.getInputStream()) {
            storageService.upload(s3Key, in, file.getSize(), MediaType.APPLICATION_PDF_VALUE);
        } catch (IOException e) {
            throw new InvalidDocumentException("Não foi possível ler o arquivo enviado", e);
        }

        try {
            DocumentRegistry saved = transactionTemplate.execute(status -> {
                DocumentRegistry registry = repository.save(new DocumentRegistry(ownerId, fileName, s3Key));
                eventPublisher.publishEvent(new DocumentUploadedEvent(registry.getId()));
                return registry;
            });
            return DocumentResponse.from(saved);
        } catch (RuntimeException e) {
            deleteQuietly(s3Key);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public DocumentResponse findById(UUID id, UUID ownerId) {
        DocumentRegistry doc = repository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        return DocumentResponse.from(doc);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> findAllByOwner(UUID ownerId) {
        return repository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
                .stream()
                .map(DocumentResponse::from)
                .toList();
    }

    private void deleteQuietly(String s3Key) {
        try {
            storageService.delete(s3Key);
        } catch (StorageException e) {
            log.warn("Falha ao remover objeto órfão {} do S3 durante compensação", s3Key, e);
        }
    }
}
