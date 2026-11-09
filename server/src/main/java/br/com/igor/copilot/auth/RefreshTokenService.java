package br.com.igor.copilot.auth;

import br.com.igor.copilot.user.User;
import br.com.igor.copilot.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Serviço responsável pela emissão, rotação, detecção de reuso e revogação de refresh tokens.
 */
@Service
public class RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTE_LENGTH = 32;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtProperties props;
    private final Clock clock;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            JwtProperties props,
            Clock clock
    ) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.props = props;
        this.clock = clock;
    }

    @Transactional
    public String issue(UUID userId) {
        User user = userRepository.getReferenceById(userId);
        return persistNew(user, clock.instant());
    }

    /**
     * Rotaciona um refresh token válido, invalidando o atual e emitindo um novo.
     * <p>
     * O atributo {@code noRollbackFor = InvalidRefreshTokenException.class} é obrigatório porque,
     * quando um reuso de token revogado é detectado, revogamos todas as sessões ativas do usuário
     * e em seguida lançamos {@link InvalidRefreshTokenException}. Sem {@code noRollbackFor}, o
     * comportamento padrão do Spring para {@link RuntimeException} faria rollback da transação
     * e desfaria a revogação em massa das sessões.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public RefreshRotation rotate(String rawToken) {
        Instant now = clock.instant();
        RefreshToken current = refreshTokenRepository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);

        User user = current.getUser();
        UUID userId = user.getId();

        if (current.isRevoked()) {
            refreshTokenRepository.revokeAllActiveByUserId(userId, now);
            log.warn("Reuso de refresh token detectado; sessões revogadas para o usuário {}", userId);
            throw new InvalidRefreshTokenException();
        }

        if (current.isExpired(now)) {
            throw new InvalidRefreshTokenException();
        }

        current.revoke(now);
        String newToken = persistNew(user, now);
        return new RefreshRotation(userId, user.getEmail(), newToken);
    }

    /**
     * Revoga de forma idempotente o refresh token informado, caso exista e esteja ativo.
     */
    @Transactional
    public void revoke(String rawToken) {
        Instant now = clock.instant();
        refreshTokenRepository.findByTokenHash(hash(rawToken))
                .ifPresent(token -> {
                    if (!token.isRevoked()) {
                        token.revoke(now);
                    }
                });
    }

    private String persistNew(User user, Instant now) {
        String rawToken = generateRawToken();
        Instant expiresAt = now.plus(props.refreshTokenTtl());
        RefreshToken refreshToken = new RefreshToken(user, hash(rawToken), expiresAt);
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }

    private String generateRawToken() {
        byte[] bytes = new byte[TOKEN_BYTE_LENGTH];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashedBytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashedBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 indisponível na JVM", e);
        }
    }
}
