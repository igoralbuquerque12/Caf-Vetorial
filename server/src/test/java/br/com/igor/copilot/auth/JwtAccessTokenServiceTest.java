package br.com.igor.copilot.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;

class JwtAccessTokenServiceTest {

    @Test
    void shouldIssueAndDecodeJwtWithExpectedClaimsAndExpiration() {
        JwtProperties props = new JwtProperties(
                "test-secret-key-with-at-least-32-characters",
                "ai-copilot",
                Duration.ofMinutes(15),
                Duration.ofDays(7)
        );
        JwtConfig jwtConfig = new JwtConfig();
        SecretKey secretKey = jwtConfig.jwtSecretKey(props);
        JwtEncoder encoder = jwtConfig.jwtEncoder(secretKey);
        JwtDecoder decoder = jwtConfig.jwtDecoder(secretKey, props);

        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        Clock fixedClock = Clock.fixed(now, ZoneOffset.UTC);

        JwtAccessTokenService service = new JwtAccessTokenService(encoder, props, fixedClock);
        UUID userId = UUID.randomUUID();
        String email = "igor@teste.com";

        AccessToken accessToken = service.issue(userId, email);
        Jwt decoded = decoder.decode(accessToken.value());

        assertThat(decoded.getSubject()).isEqualTo(userId.toString());
        assertThat(decoded.getClaimAsString("iss")).isEqualTo("ai-copilot");
        assertThat(decoded.getClaimAsString("email")).isEqualTo(email);
        assertThat(decoded.getIssuedAt()).isEqualTo(now);
        assertThat(decoded.getExpiresAt()).isEqualTo(now.plus(Duration.ofMinutes(15)));
    }
}
