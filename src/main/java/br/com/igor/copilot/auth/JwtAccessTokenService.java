package br.com.igor.copilot.auth;

import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

/**
 * Implementação de {@link AccessTokenService} baseada em JWT assinado com HMAC SHA-256 (HS256).
 */
@Service
public class JwtAccessTokenService implements AccessTokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties props;
    private final Clock clock;

    public JwtAccessTokenService(JwtEncoder jwtEncoder, JwtProperties props, Clock clock) {
        this.jwtEncoder = jwtEncoder;
        this.props = props;
        this.clock = clock;
    }

    @Override
    public AccessToken issue(UUID userId, String email) {
        Instant now = clock.instant();
        Instant expiresAt = now.plus(props.accessTokenTtl());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(props.issuer())
                .subject(userId.toString())
                .issuedAt(now)
                .expiresAt(expiresAt)
                .claim("email", email)
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String value = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
        return new AccessToken(value, expiresAt);
    }
}
