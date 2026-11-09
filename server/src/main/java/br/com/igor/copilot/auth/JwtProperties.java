package br.com.igor.copilot.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas de configuração para geração e validação de tokens JWT e refresh tokens.
 */
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProperties(
        @NotBlank(message = "O segredo JWT é obrigatório")
        @Size(min = 32, message = "O segredo JWT deve ter no mínimo 32 caracteres")
        String secret,

        @NotBlank(message = "O emissor (issuer) do JWT é obrigatório")
        String issuer,

        @NotNull(message = "O tempo de vida do access token é obrigatório")
        Duration accessTokenTtl,

        @NotNull(message = "O tempo de vida do refresh token é obrigatório")
        Duration refreshTokenTtl
) {
}
