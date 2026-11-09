package br.com.igor.copilot.chat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.igor.copilot.auth.dto.LoginRequest;
import br.com.igor.copilot.auth.dto.TokenResponse;
import br.com.igor.copilot.chat.dto.AskQuestionRequest;
import br.com.igor.copilot.chat.dto.ChatAnswerResponse;
import br.com.igor.copilot.chat.dto.SourceReference;
import br.com.igor.copilot.document.dto.DocumentResponse;
import br.com.igor.copilot.support.FakeChatModel;
import br.com.igor.copilot.support.IntegrationTest;
import br.com.igor.copilot.support.TestPdfs;
import br.com.igor.copilot.user.dto.CreateUserRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
class DocumentChatIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final FakeChatModel fakeChatModel;

    DocumentChatIntegrationTest(
            MockMvc mockMvc,
            ObjectMapper objectMapper,
            FakeChatModel fakeChatModel
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.fakeChatModel = fakeChatModel;
    }

    @BeforeEach
    void setUp() {
        fakeChatModel.reset();
    }

    private String registerAndLogin() throws Exception {
        String email = "chat-user-" + UUID.randomUUID() + "@teste.com";
        String password = "password123";

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateUserRequest(email, password))))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();

        TokenResponse tokens = objectMapper.readValue(loginResult.getResponse().getContentAsString(), TokenResponse.class);
        return tokens.accessToken();
    }

    private UUID uploadDocumentAndWaitForStatus(String accessToken, byte[] pdfBytes, String expectedStatus) throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "documento.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                pdfBytes
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/v1/documents")
                        .file(file)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isAccepted())
                .andReturn();

        DocumentResponse initial = objectMapper.readValue(
                uploadResult.getResponse().getContentAsString(),
                DocumentResponse.class
        );

        await().atMost(Duration.ofSeconds(20)).untilAsserted(() ->
                mockMvc.perform(get("/api/v1/documents/{id}", initial.id())
                                .header("Authorization", "Bearer " + accessToken))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.status").value(expectedStatus))
        );

        return initial.id();
    }

    @Test
    void shouldAnswerQuestionAboutDocumentA1WithIsolatedContextAndHandleBracesAndOwnership() throws Exception {
        String tokenA = registerAndLogin();
        UUID docA1 = uploadDocumentAndWaitForStatus(
                tokenA,
                TestPdfs.withText("A taxa de carregamento deste plano é de dois por cento."),
                "COMPLETED"
        );
        uploadDocumentAndWaitForStatus(
                tokenA,
                TestPdfs.withText("Texto sem relação: receita de bolo de banana."),
                "COMPLETED"
        );

        // Cenário 1: Pergunta sobre A1 com verificação de isolamento em relação a A2
        AskQuestionRequest questionA1 = new AskQuestionRequest("Qual é a taxa de carregamento?", docA1);
        MvcResult chatResult = mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(questionA1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value(FakeChatModel.DEFAULT_ANSWER))
                .andExpect(jsonPath("$.sources").isNotEmpty())
                .andReturn();

        ChatAnswerResponse answerResponse = objectMapper.readValue(
                chatResult.getResponse().getContentAsString(),
                ChatAnswerResponse.class
        );
        assertThat(answerResponse.sources()).isNotEmpty();
        for (SourceReference source : answerResponse.sources()) {
            assertThat(source.excerpt()).contains("taxa de carregamento");
            assertThat(source.page()).isEqualTo(1);
            assertThat(source.chunkIndex()).isEqualTo(0);
        }

        assertThat(fakeChatModel.lastPrompt()).isNotNull();
        String fullPromptContents = fakeChatModel.lastPrompt().getContents().replaceAll("\\s+", " ");
        assertThat(fullPromptContents)
                .contains("taxa de carregamento deste plano")
                .contains("dois por cento")
                .contains("Copilot de Previdência")
                .doesNotContain("bolo de banana");

        // Cenário 2: Pergunta com chaves {carência} -> não é interpretada como template
        AskQuestionRequest questionWithBraces = new AskQuestionRequest("O que significa {carência}?", docA1);
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(questionWithBraces)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value(FakeChatModel.DEFAULT_ANSWER));

        // Cenário 3: Posse -> Usuário B perguntando sobre documento A1 recebe 404
        String tokenB = registerAndLogin();
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(questionA1)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void shouldReturn409WithStatusPropertyWhenDocumentIsNotReady() throws Exception {
        String token = registerAndLogin();
        UUID failedDocId = uploadDocumentAndWaitForStatus(
                token,
                TestPdfs.blankPage(),
                "FAILED"
        );

        AskQuestionRequest request = new AskQuestionRequest("Qual é a regra?", failedDocId);
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.documentStatus").value("FAILED"))
                .andExpect(jsonPath("$.detail").value("O documento ainda não está pronto para perguntas (status: FAILED)"));
    }

    @Test
    void shouldValidateAskQuestionRequestAndRequireAuthentication() throws Exception {
        String token = registerAndLogin();
        UUID randomDocId = UUID.randomUUID();

        // Pergunta em branco -> 400
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AskQuestionRequest("   ", randomDocId))))
                .andExpect(status().isBadRequest());

        // Sem documentId -> 400
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\": \"Pergunta valida?\"}"))
                .andExpect(status().isBadRequest());

        // Pergunta com mais de 2000 caracteres -> 400
        String tooLongQuestion = "a".repeat(2001);
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AskQuestionRequest(tooLongQuestion, randomDocId))))
                .andExpect(status().isBadRequest());

        // documentId que não é um UUID -> 400
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\": \"Pergunta valida?\", \"documentId\": \"nao-e-uuid\"}"))
                .andExpect(status().isBadRequest());

        // Sem token -> 401
        mockMvc.perform(post("/api/v1/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AskQuestionRequest("Pergunta?", randomDocId))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturn502BadGatewayWhenAiProviderFails() throws Exception {
        String token = registerAndLogin();
        UUID docId = uploadDocumentAndWaitForStatus(
                token,
                TestPdfs.withText("Regulamento do plano de previdencia."),
                "COMPLETED"
        );

        fakeChatModel.failNextCall();

        AskQuestionRequest request = new AskQuestionRequest("Qual é a regra?", docId);
        mockMvc.perform(post("/api/v1/chat")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.status").value(502))
                .andExpect(jsonPath("$.detail").value("O serviço de IA não respondeu. Tente novamente em instantes."));
    }
}
