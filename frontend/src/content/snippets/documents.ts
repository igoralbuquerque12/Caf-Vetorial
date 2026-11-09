import type { Snippet } from '../../flows/types'

export const documentController: Snippet = {
  language: 'java',
  code: `@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Jwt jwt) {
        DocumentResponse response = documentService.upload(CurrentUser.id(jwt), file);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(response.id()).toUri();
        return ResponseEntity.accepted().location(location).body(response);
    }
}`,
  highlight: [11, 19],
}

export const documentControllerRead: Snippet = {
  language: 'java',
  code: `@GetMapping("/{id}")
public DocumentResponse findById(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
    return documentService.findById(id, CurrentUser.id(jwt));
}

@GetMapping
public List<DocumentResponse> findAll(@AuthenticationPrincipal Jwt jwt) {
    return documentService.findAllByOwner(CurrentUser.id(jwt));
}`,
  highlight: [2, 3],
}

export const documentServiceUpload: Snippet = {
  language: 'java',
  code: `public DocumentResponse upload(UUID ownerId, MultipartFile file) {
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
        deleteQuietly(s3Key); // compensação: não deixa objeto órfão no S3
        throw e;
    }
}`,
  highlight: [10, 20],
}

export const documentServiceRead: Snippet = {
  language: 'java',
  code: `@Transactional(readOnly = true)
public DocumentResponse findById(UUID id, UUID ownerId) {
    return repository.findByIdAndOwnerId(id, ownerId)
            .map(DocumentResponse::from)
            .orElseThrow(() -> new DocumentNotFoundException(id));
}

@Transactional(readOnly = true)
public List<DocumentResponse> findAllByOwner(UUID ownerId) {
    return repository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
            .stream()
            .map(DocumentResponse::from)
            .toList();
}`,
  highlight: [3, 5],
}

export const documentRepository: Snippet = {
  language: 'java',
  code: `public interface DocumentRegistryRepository
        extends JpaRepository<DocumentRegistry, UUID> {

    // WHERE id = ? AND owner_id = ?  -> a posse faz parte da consulta
    Optional<DocumentRegistry> findByIdAndOwnerId(UUID id, UUID ownerId);

    // WHERE owner_id = ? ORDER BY created_at DESC
    List<DocumentRegistry> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);
}`,
  highlight: [4, 5],
}

export const pdfValidator: Snippet = {
  language: 'java',
  code: `public String validateAndSanitizeFileName(MultipartFile file) {
    if (file == null || file.isEmpty()) {
        throw new InvalidDocumentException("O arquivo não pode ser vazio");
    }
    validateContentType(file.getContentType());
    validateMagicBytes(file);
    return sanitizeFileName(file.getOriginalFilename());
}

private void validateMagicBytes(MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
        byte[] header = in.readNBytes(PDF_MAGIC_BYTES.length); // "%PDF-"
        if (!Arrays.equals(header, PDF_MAGIC_BYTES)) {
            throw new InvalidDocumentException(
                "O arquivo enviado não possui assinatura binária de PDF (%PDF-)");
        }
    } catch (IOException e) {
        throw new InvalidDocumentException("Não foi possível ler o arquivo enviado", e);
    }
}`,
  highlight: [10, 17],
}

export const documentEntityStatus: Snippet = {
  language: 'java',
  code: `@Entity
@Table(name = "document_registry")
public class DocumentRegistry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DocumentStatus status; // PENDING, PROCESSING, COMPLETED, FAILED

    public DocumentRegistry(UUID ownerId, String fileName, String s3Key) {
        this.ownerId = ownerId;
        this.fileName = fileName;
        this.s3Key = s3Key;
        this.status = DocumentStatus.PENDING;
    }

    public void startProcessing() { this.status = DocumentStatus.PROCESSING; }
    public void complete(int chunkCount) { this.status = DocumentStatus.COMPLETED; this.chunkCount = chunkCount; }
}`,
  highlight: [13, 17],
}

export const documentStatusService: Snippet = {
  language: 'java',
  code: `@Transactional
public Optional<DocumentProcessingSnapshot> markProcessing(UUID id) {
    Optional<DocumentRegistry> found = repository.findById(id);
    if (found.isEmpty()) {
        return Optional.empty();
    }
    DocumentRegistry doc = found.get();
    if (doc.isCompleted()) {
        return Optional.empty(); // mensagem duplicada: idempotência
    }
    doc.startProcessing(); // dirty checking gera o UPDATE
    return Optional.of(new DocumentProcessingSnapshot(
            doc.getId(), doc.getOwnerId(), doc.getFileName(), doc.getS3Key()));
}`,
  highlight: [7, 10],
}

export const documentStatusCompleted: Snippet = {
  language: 'java',
  code: `@Transactional
public void markCompleted(UUID id, int chunkCount) {
    DocumentRegistry doc = repository.findById(id)
            .orElseThrow(() -> new DocumentNotFoundException(id));
    doc.complete(chunkCount);
}

// REQUIRES_NEW: abre uma transação própria. Se a transação do chamador
// sofrer rollback, o status FAILED ainda assim é gravado.
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void markFailed(UUID id, String message) {
    repository.findById(id).ifPresent(doc -> doc.fail(message));
}`,
  highlight: [8, 12],
}

export const bearerAuthHeader: Snippet = {
  language: 'java',
  code: `// Todas as rotas fora da lista pública exigem um JWT válido:
.authorizeHttpRequests(auth -> auth
    .requestMatchers(HttpMethod.POST, PUBLIC_POST_ENDPOINTS).permitAll()
    .requestMatchers("/error").permitAll()
    .anyRequest().authenticated())
.oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))

// Sem token, com token expirado ou com assinatura inválida:
// 401 + "WWW-Authenticate: Bearer ..." gerado pelo próprio filtro.`,
  highlight: [5, 6],
}
