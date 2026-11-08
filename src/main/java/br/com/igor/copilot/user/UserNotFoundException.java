package br.com.igor.copilot.user;

import java.util.UUID;

/**
 * Exceção lançada quando um usuário buscado pelo identificador não é encontrado.
 */
public class UserNotFoundException extends RuntimeException {

    public UserNotFoundException(UUID id) {
        super("Usuário não encontrado");
    }
}
