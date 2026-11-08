package br.com.igor.copilot.auth;

import java.time.Instant;

/**
 * Representa um access token emitido junto ao seu instante de expiração.
 */
public record AccessToken(
        String value,
        Instant expiresAt
) {
}
