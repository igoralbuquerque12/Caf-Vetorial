package br.com.igor.copilot.shared.security;

import java.util.UUID;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Utilitário para extração do identificador do usuário autenticado a partir do token JWT validado.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
