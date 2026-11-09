package br.com.igor.copilot.storage;

/**
 * Exceção lançada quando ocorre uma falha de comunicação ou operação no serviço de armazenamento de arquivos.
 */
public class StorageException extends RuntimeException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public StorageException(String message) {
        super(message);
    }
}
