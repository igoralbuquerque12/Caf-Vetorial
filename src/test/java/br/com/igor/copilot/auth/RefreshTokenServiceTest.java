package br.com.igor.copilot.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.igor.copilot.user.User;
import br.com.igor.copilot.user.UserRepository;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-01-15T12:00:00Z");

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserRepository userRepository;

    private Clock clock;
    private JwtProperties props;
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        clock = Clock.fixed(NOW, ZoneOffset.UTC);
        props = new JwtProperties(
                "test-secret-key-with-at-least-32-characters",
                "ai-copilot",
                Duration.ofMinutes(15),
                Duration.ofDays(7)
        );
        refreshTokenService = new RefreshTokenService(refreshTokenRepository, userRepository, props, clock);
    }

    @Test
    void issueShouldPersistSha256HexHashDifferentFromRawToken() {
        UUID userId = UUID.randomUUID();
        User userRef = new User("user@teste.com", "hash");
        when(userRepository.getReferenceById(userId)).thenReturn(userRef);

        String rawToken = refreshTokenService.issue(userId);

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        RefreshToken saved = captor.getValue();

        assertThat(rawToken).isNotBlank();
        assertThat(saved.getTokenHash())
                .hasSize(64)
                .matches("^[0-9a-f]{64}$")
                .isNotEqualTo(rawToken);
        assertThat(saved.getExpiresAt()).isEqualTo(NOW.plus(Duration.ofDays(7)));
    }

    @Test
    void rotateWithValidTokenShouldRevokeCurrentAndReturnDifferentToken() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);
        when(user.getEmail()).thenReturn("user@teste.com");

        RefreshToken current = new RefreshToken(user, "existing-hash", NOW.plus(Duration.ofDays(1)));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(current));

        String rawToken = "valid-raw-token";
        RefreshRotation rotation = refreshTokenService.rotate(rawToken);

        assertThat(current.isRevoked()).isTrue();
        assertThat(current.getRevokedAt()).isEqualTo(NOW);
        assertThat(rotation.userId()).isEqualTo(userId);
        assertThat(rotation.email()).isEqualTo("user@teste.com");
        assertThat(rotation.refreshToken())
                .isNotBlank()
                .isNotEqualTo(rawToken);
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void rotateWithExpiredTokenShouldThrowInvalidRefreshTokenException() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);

        RefreshToken expired = new RefreshToken(user, "expired-hash", NOW.minusSeconds(1));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.rotate("expired-raw-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token inválido ou expirado");

        verify(refreshTokenRepository, never()).save(any());
        verify(refreshTokenRepository, never()).revokeAllActiveByUserId(any(), any());
    }

    @Test
    void rotateWithRevokedTokenShouldRevokeAllActiveSessionsAndThrowException() {
        UUID userId = UUID.randomUUID();
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);

        RefreshToken revoked = new RefreshToken(user, "revoked-hash", NOW.plus(Duration.ofDays(1)));
        revoked.revoke(NOW.minusSeconds(60));
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(revoked));

        assertThatThrownBy(() -> refreshTokenService.rotate("reused-raw-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token inválido ou expirado");

        verify(refreshTokenRepository).revokeAllActiveByUserId(userId, NOW);
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void rotateWithNonExistentTokenShouldThrowInvalidRefreshTokenException() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.rotate("unknown-token"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .hasMessage("Refresh token inválido ou expirado");

        verify(refreshTokenRepository, never()).save(any());
        verify(refreshTokenRepository, never()).revokeAllActiveByUserId(any(), any());
    }
}
