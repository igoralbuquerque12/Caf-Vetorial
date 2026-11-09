package br.com.igor.copilot.document;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

/**
 * Entidade JPA que representa o registro e estado de processamento de um documento na tabela {@code document_registry}.
 * <p>
 * O nome da classe é {@code DocumentRegistry} (e não {@code Document}) para evitar colisão de nomes com
 * {@code org.springframework.ai.document.Document}, que é utilizado no pipeline de ingestão RAG.
 * <p>
 * O campo {@code ownerId} é mapeado como um {@link UUID} simples em vez de um relacionamento {@code @ManyToOne}
 * para {@code User}: o módulo de documentos precisa apenas do identificador do proprietário para verificar posse
 * e filtrar consultas, evitando carregamento {@code LAZY} desnecessário e acoplamento direto entre módulos.
 */
@Entity
@Table(name = "document_registry")
public class DocumentRegistry {

    private static final int MAX_ERROR_MESSAGE_LENGTH = 1000;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "owner_id", nullable = false, updatable = false)
    private UUID ownerId;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "s3_key", nullable = false, length = 512)
    private String s3Key;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /**
     * Construtor sem argumentos exigido pela especificação JPA para hidratação via reflexão.
     */
    protected DocumentRegistry() {
    }

    public DocumentRegistry(UUID ownerId, String fileName, String s3Key) {
        this.ownerId = ownerId;
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.status = DocumentStatus.PENDING;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void startProcessing() {
        this.status = DocumentStatus.PROCESSING;
        this.errorMessage = null;
        this.chunkCount = null;
    }

    public void complete(int chunkCount) {
        this.status = DocumentStatus.COMPLETED;
        this.chunkCount = chunkCount;
        this.errorMessage = null;
    }

    public void fail(String message) {
        this.status = DocumentStatus.FAILED;
        if (message == null) {
            this.errorMessage = null;
        } else if (message.length() > MAX_ERROR_MESSAGE_LENGTH) {
            this.errorMessage = message.substring(0, MAX_ERROR_MESSAGE_LENGTH);
        } else {
            this.errorMessage = message;
        }
    }

    public boolean isCompleted() {
        return this.status == DocumentStatus.COMPLETED;
    }

    public UUID getId() {
        return id;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getS3Key() {
        return s3Key;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public Integer getChunkCount() {
        return chunkCount;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
