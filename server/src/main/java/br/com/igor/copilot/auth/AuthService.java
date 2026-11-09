package br.com.igor.copilot.auth;

import br.com.igor.copilot.auth.dto.LoginRequest;
import br.com.igor.copilot.auth.dto.RefreshTokenRequest;
import br.com.igor.copilot.auth.dto.TokenResponse;
import br.com.igor.copilot.user.EmailNormalizer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

/**
 * Orquestra os fluxos de login, renovação de tokens (refresh) e logout.
 * <p>
 * Esta classe propositalmente não utiliza {@code @Transactional}: o controle transacional fica
 * encapsulado no {@link RefreshTokenService}. Se {@link #refresh(RefreshTokenRequest)} abrisse
 * uma transação externa, a exceção {@link InvalidRefreshTokenException} lançada na detecção de
 * reuso marcaria a transação externa como <i>rollback-only</i>, anulando o {@code noRollbackFor}
 * configurado no método interno.
 */
@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final AccessTokenService accessTokenService;
    private final RefreshTokenService refreshTokenService;
    private final JwtProperties props;

    public AuthService(
            AuthenticationManager authenticationManager,
            AccessTokenService accessTokenService,
            RefreshTokenService refreshTokenService,
            JwtProperties props
    ) {
        this.authenticationManager = authenticationManager;
        this.accessTokenService = accessTokenService;
        this.refreshTokenService = refreshTokenService;
        this.props = props;
    }

    public TokenResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        EmailNormalizer.normalize(request.email()),
                        request.password()
                )
        );
        SecurityUser user = (SecurityUser) authentication.getPrincipal();
        AccessToken access = accessTokenService.issue(user.id(), user.email());
        String refresh = refreshTokenService.issue(user.id());
        return TokenResponse.bearer(access.value(), refresh, props.accessTokenTtl().toSeconds());
    }

    public TokenResponse refresh(RefreshTokenRequest request) {
        RefreshRotation rotation = refreshTokenService.rotate(request.refreshToken());
        AccessToken access = accessTokenService.issue(rotation.userId(), rotation.email());
        return TokenResponse.bearer(access.value(), rotation.refreshToken(), props.accessTokenTtl().toSeconds());
    }

    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }
}
