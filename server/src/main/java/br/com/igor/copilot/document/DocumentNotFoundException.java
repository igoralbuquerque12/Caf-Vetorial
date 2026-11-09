package br.com.igor.copilot.document;

import java.util.UUID;

/**
 * Exceção lançada quando um documento não é encontrado ou não pertence ao usuário autenticado.
 */
public class DocumentNotFoundException extends RuntimeException {

    public DocumentNotFoundException() {
        super("Documento não encontrado");
    }

    public DocumentNotFoundException(UUID id) {
        super("Documento não encontrado");
    }
}
