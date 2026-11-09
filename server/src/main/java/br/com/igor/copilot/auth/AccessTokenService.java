package br.com.igor.copilot.auth;

import java.util.UUID;

/**
 * Contrato para emissão de tokens de acesso de curta duração.
 */
public interface AccessTokenService {

    AccessToken issue(UUID userId, String email);
}
