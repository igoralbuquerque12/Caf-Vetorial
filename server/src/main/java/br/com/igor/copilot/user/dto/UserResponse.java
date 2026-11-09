package br.com.igor.copilot.user.dto;

import br.com.igor.copilot.user.User;
import java.time.Instant;
import java.util.UUID;

/**
 * Representação pública de um usuário retornada pela API, sem expor dados sensíveis como hash de senha.
 */
public record UserResponse(
        UUID id,
        String email,
        Instant createdAt
) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getCreatedAt());
    }
}
