package br.com.igor.copilot.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Corpo de requisição contendo o refresh token para renovação de sessão ou logout.
 */
public record RefreshTokenRequest(
        @NotBlank(message = "O refresh token é obrigatório")
        String refreshToken
) {
}
