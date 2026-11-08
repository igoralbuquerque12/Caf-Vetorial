package br.com.igor.copilot.document;

/**
 * Exceção lançada quando o arquivo enviado no upload não atende aos requisitos de validação de PDF.
 */
public class InvalidDocumentException extends RuntimeException {

    public InvalidDocumentException(String message) {
        super(message);
    }

    public InvalidDocumentException(String message, Throwable cause) {
        super(message, cause);
    }
}
