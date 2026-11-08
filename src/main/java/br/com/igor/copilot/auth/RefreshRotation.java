package br.com.igor.copilot.auth;

import java.util.UUID;

/**
 * Resultado da rotação de um refresh token, contendo os dados do usuário e o novo token em texto puro.
 */
public record RefreshRotation(
        UUID userId,
        String email,
        String refreshToken
) {
}
