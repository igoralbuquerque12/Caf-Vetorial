package br.com.igor.copilot.auth;

/**
 * Exceção lançada quando um refresh token é inexistente, expirado ou já foi revogado.
 * Usa uma mensagem genérica para não expor o motivo exato da rejeição.
 */
public class InvalidRefreshTokenException extends RuntimeException {

    public InvalidRefreshTokenException() {
        super("Refresh token inválido ou expirado");
    }
}
