package br.com.igor.copilot.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.igor.copilot.TestcontainersConfiguration;
import br.com.igor.copilot.auth.dto.LoginRequest;
import br.com.igor.copilot.auth.dto.RefreshTokenRequest;
import br.com.igor.copilot.auth.dto.TokenResponse;
import br.com.igor.copilot.user.dto.CreateUserRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Locale;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestConstructor;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
@ActiveProfiles("test")
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class AuthFlowIntegrationTest {

    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;

    AuthFlowIntegrationTest(MockMvc mockMvc, ObjectMapper objectMapper) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
    }

    private String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@teste.com";
    }

    @Test
    void shouldCreateUserReturning201WithoutPasswordFields() throws Exception {
        String email = uniqueEmail();
        CreateUserRequest request = new CreateUserRequest(email, "password123");

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void shouldReturn409ProblemDetailOnDuplicateEmailInUppercase() throws Exception {
        String email = uniqueEmail();
        CreateUserRequest first = new CreateUserRequest(email, "password123");
        CreateUserRequest duplicateUpper = new CreateUserRequest(email.toUpperCase(Locale.ROOT), "password123");

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(first)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(duplicateUpper)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.detail").value("E-mail já cadastrado"));
    }

    @Test
    void shouldReturn400WithFieldErrorsOnInvalidCreateUserRequest() throws Exception {
        CreateUserRequest invalid = new CreateUserRequest("not-an-email", "short");

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.detail").value("Dados inválidos"))
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty());
    }

    @Test
    void shouldLoginReturning200WithBearerTokensAndExpiresIn900() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");

        LoginRequest login = new LoginRequest(email, "password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void shouldReturnIdentical401DetailForWrongPasswordAndNonExistentEmail() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");

        LoginRequest wrongPassword = new LoginRequest(email, "wrongPassword123");
        MvcResult wrongPassResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongPassword)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.detail").value("Credenciais inválidas"))
                .andReturn();

        LoginRequest unknownEmail = new LoginRequest("nonexistent-" + UUID.randomUUID() + "@teste.com", "password123");
        MvcResult unknownEmailResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(unknownEmail)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.detail").value("Credenciais inválidas"))
                .andReturn();

        JsonNode wrongPassJson = objectMapper.readTree(wrongPassResult.getResponse().getContentAsString());
        JsonNode unknownEmailJson = objectMapper.readTree(unknownEmailResult.getResponse().getContentAsString());
        assertThat(wrongPassJson.get("detail").asText())
                .isEqualTo(unknownEmailJson.get("detail").asText());
    }

    @Test
    void shouldReturn401ForMeWithoutTokenAnd200WithToken() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");
        TokenResponse tokens = loginUser(email, "password123");

        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokens.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void shouldRotateRefreshTokenReturningDifferentToken() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");
        TokenResponse initialTokens = loginUser(email, "password123");

        RefreshTokenRequest refreshRequest = new RefreshTokenRequest(initialTokens.refreshToken());
        MvcResult result = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(refreshRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").value(900))
                .andReturn();

        TokenResponse rotatedTokens = objectMapper.readValue(
                result.getResponse().getContentAsString(),
                TokenResponse.class
        );
        assertThat(rotatedTokens.refreshToken()).isNotEqualTo(initialTokens.refreshToken());
    }

    @Test
    void shouldRevokeAllSessionsWhenRefreshTokenReuseIsDetected() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");
        TokenResponse initialTokens = loginUser(email, "password123");

        // 1. Primeira rotação válida
        RefreshTokenRequest firstRefresh = new RefreshTokenRequest(initialTokens.refreshToken());
        MvcResult rotateResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRefresh)))
                .andExpect(status().isOk())
                .andReturn();

        TokenResponse rotatedTokens = objectMapper.readValue(
                rotateResult.getResponse().getContentAsString(),
                TokenResponse.class
        );

        // 2. Reuso do token antigo -> retorna 401 e revoga todas as sessões ativas
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(firstRefresh)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Refresh token inválido ou expirado"));

        // 3. O token novo também passa a retornar 401 porque todas as sessões foram revogadas
        RefreshTokenRequest secondRefreshWithNewToken = new RefreshTokenRequest(rotatedTokens.refreshToken());
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRefreshWithNewToken)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Refresh token inválido ou expirado"));
    }

    @Test
    void shouldReturn401OnRefreshAfterLogout() throws Exception {
        String email = uniqueEmail();
        registerUser(email, "password123");
        TokenResponse tokens = loginUser(email, "password123");

        RefreshTokenRequest logoutRequest = new RefreshTokenRequest(tokens.refreshToken());
        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(logoutRequest)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Refresh token inválido ou expirado"));
    }

    private void registerUser(String email, String password) throws Exception {
        CreateUserRequest request = new CreateUserRequest(email, password);
        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private TokenResponse loginUser(String email, String password) throws Exception {
        LoginRequest login = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), TokenResponse.class);
    }
}
