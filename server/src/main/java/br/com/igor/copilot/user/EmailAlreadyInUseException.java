package br.com.igor.copilot.user;

/**
 * Exceção lançada quando há tentativa de cadastro com um endereço de e-mail já existente.
 */
public class EmailAlreadyInUseException extends RuntimeException {

    public EmailAlreadyInUseException(String email) {
        super("E-mail já cadastrado");
    }
}
