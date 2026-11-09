package br.com.igor.copilot.config;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas do CORS (prefixo {@code app.cors}).
 * <p>
 * Em YAML, uma lista pode ser escrita separada por vírgulas:
 * {@code app.cors.allowed-origins: http://localhost:5173,https://app.exemplo.com}.
 *
 * @param allowedOrigins origens (esquema + host + porta) autorizadas a chamar a API pelo navegador
 */
@Validated
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(
        @NotEmpty(message = "Informe ao menos uma origem permitida para o CORS")
        List<String> allowedOrigins
) {
}
