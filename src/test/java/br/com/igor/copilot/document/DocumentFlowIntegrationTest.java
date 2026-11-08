package br.com.igor.copilot.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.igor.copilot.auth.dto.LoginRequest;
import br.com.igor.copilot.auth.dto.TokenResponse;
import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.document.ingestion.DocumentIngestionService;
import br.com.igor.copilot.support.InMemoryStorageService;
import br.com.igor.copilot.support.IntegrationTest;
import br.com.igor.copilot.support.TestPdfs;
import br.com.igor.copilot.user.dto.CreateUserRequest;
import br.com.igor.copilot.user.dto.UserResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
class DocumentFlowIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final InMemoryStorageService storageService;
    private final DocumentRegistryRepository documentRepository;
    private final DocumentIngestionService ingestionService;

    DocumentFlowIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            JdbcTemplate jdbcTemplate,
            InMemoryStorageService storageService,
            DocumentRegistryRepository documentRepository,
            DocumentIngestionService ingestionService
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.storageService = storageService;
        this.documentRepository = documentRepository;
        this.ingestionService = ingestionService;
    }

    private record AuthenticatedUser(UUID id, String email, String accessToken) {
    }

    private AuthenticatedUser registerAndLogin() throws Exception {
        String email = "doc-user-" + UUID.randomUUID() + "@teste.com";
        String password = "password123";

        MvcResult createResult = mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserRequest(email, password))))
                .andExpect(status().isCreated())
                .andReturn();
        UserResponse user = objectMapper.readValue(createResult.getResponse().getContentAsString(), UserResponse.class);

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();
        TokenResponse tokens = objectMapper.readValue(loginResult.getResponse().getContentAsString(), TokenResponse.class);

        return new AuthenticatedUser(user.id(), user.email(), tokens.accessToken());
    }

    @Test
    void shouldCompleteFullUploadQueueAndRagIngestionFlowAndGuaranteeIdempotency() throws Exception {
        AuthenticatedUser user = registerAndLogin();
        byte[] pdfBytes = TestPdfs.withText(
                "Regulamento pagina 1 sobre regras gerais do sistema.",
                "Regras de resgate pagina 2 sobre prazos e condicoes."
        );
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "regulamento.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfBytes
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .header("Authorization", "Bearer " + user.accessToken()))
                .andExpect(status().isAccepted())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.fileName").value("regulamento.pdf"))
                .andExpect(jsonPath("$.s3Key").doesNotExist())
                .andExpect(jsonPath("$.ownerId").doesNotExist())
                .andReturn();

        DocumentResponse initial = objectMapper.readValue(
                uploadResult.getResponse().getContentAsString(),
                DocumentResponse.class
        );
        UUID docId = initial.id();

        await().atMost(Duration.ofSeconds(20)).untilAsserted(() ->
                mockMvc.perform(get("/api/v1/documents/{id}", docId)
                                .header("Authorization", "Bearer " + user.accessToken()))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("COMPLETED"))
                        .andExpect(jsonPath("$.chunkCount", Matchers.greaterThan(0)))
        );

        DocumentRegistry persisted = documentRepository.findById(docId).orElseThrow();
        assertThat(storageService.contains(persisted.getS3Key())).isTrue();

        Integer vectorCount = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE metadata->>'document_id' = ? AND metadata->>'owner_id' = ?",
                Integer.class,
                docId.toString(),
                user.id().toString()
        );
        assertThat(vectorCount).isNotNull().isGreaterThan(0);

        // Idempotência 1: chamar ingest(id) quando já está COMPLETED é ignorado
        ingestionService.ingest(docId);
        Integer countAfterDuplicateCall = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE metadata->>'document_id' = ?",
                Integer.class,
                docId.toString()
        );
        assertThat(countAfterDuplicateCall).isEqualTo(vectorCount);

        // Idempotência 2: forçar status PROCESSING e reexecutar ingest(id) substitui vetores sem duplicar
        jdbcTemplate.update(
                "UPDATE document_registry SET status = 'PROCESSING' WHERE id = ?",
                docId
        );
        ingestionService.ingest(docId);

        Integer countAfterReingest = jdbcTemplate.queryForObject(
                "SELECT count(*) FROM vector_store WHERE metadata->>'document_id' = ?",
                Integer.class,
                docId.toString()
        );
        assertThat(countAfterReingest).isEqualTo(vectorCount);

        DocumentRegistry afterReingest = documentRepository.findById(docId).orElseThrow();
        assertThat(afterReingest.getStatus()).isEqualTo(DocumentStatus.COMPLETED);
    }

    @Test
    void shouldMarkDocumentAsFailedWithOcrMessageWhenPdfHasNoExtractableText() throws Exception {
        AuthenticatedUser user = registerAndLogin();
        MockMultipartFile blankPdf = new MockMultipartFile(
                "file",
                "escaneado.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                TestPdfs.blankPage()
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/documents")
                        .file(blankPdf)
                        .header("Authorization", "Bearer " + user.accessToken()))
                .andExpect(status().isAccepted())
                .andReturn();

        DocumentResponse initial = objectMapper.readValue(
                uploadResult.getResponse().getContentAsString(),
                DocumentResponse.class
        );

        await().atMost(Duration.ofSeconds(20)).untilAsserted(() ->
                mockMvc.perform(get("/api/v1/documents/{id}", initial.id())
                                .header("Authorization", "Bearer " + user.accessToken()))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value("FAILED"))
                        .andExpect(jsonPath("$.errorMessage", Matchers.containsString("OCR")))
        );
    }

    @Test
    void shouldValidateUploadRequestsAndRequireAuthentication() throws Exception {
        AuthenticatedUser user = registerAndLogin();

        MockMultipartFile plainText = new MockMultipartFile(
                "file",
                "notas.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "%PDF-1.7 texto".getBytes(StandardCharsets.US_ASCII)
        );
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(plainText)
                        .header("Authorization", "Bearer " + user.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        MockMultipartFile fakeMagicBytes = new MockMultipartFile(
                "file",
                "falso.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "HELLO WORLD".getBytes(StandardCharsets.US_ASCII)
        );
        mockMvc.perform(multipart("/api/v1/documents")
                        .file(fakeMagicBytes)
                        .header("Authorization", "Bearer " + user.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));

        MockMultipartFile validPdf = new MockMultipartFile(
                "file",
                "valido.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                TestPdfs.withText("Texto valido")
        );
        mockMvc.perform(multipart("/api/v1/documents").file(validPdf))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldEnforceDocumentOwnershipReturning404ToOtherUser() throws Exception {
        AuthenticatedUser userA = registerAndLogin();
        AuthenticatedUser userB = registerAndLogin();

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "privado.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                TestPdfs.withText("Documento privado do usuario A")
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .header("Authorization", "Bearer " + userA.accessToken()))
                .andExpect(status().isAccepted())
                .andReturn();

        DocumentResponse docA = objectMapper.readValue(
                uploadResult.getResponse().getContentAsString(),
                DocumentResponse.class
        );

        mockMvc.perform(get("/api/v1/documents/{id}", docA.id())
                        .header("Authorization", "Bearer " + userB.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        mockMvc.perform(get("/api/v1/documents")
                        .header("Authorization", "Bearer " + userB.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].id", Matchers.not(Matchers.hasItem(docA.id().toString()))));
    }

    @Test
    void shouldReturn400WhenDocumentIdPathVariableIsNotValidUuid() throws Exception {
        AuthenticatedUser user = registerAndLogin();

        mockMvc.perform(get("/api/v1/documents/nao-e-uuid")
                        .header("Authorization", "Bearer " + user.accessToken()))
                .andExpect(status().isBadRequest());
    }
}
