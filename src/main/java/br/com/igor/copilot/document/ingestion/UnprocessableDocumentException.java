package br.com.igor.copilot.document.ingestion;

/**
 * Exceção que representa um erro permanente no conteúdo do documento (como PDF sem texto extraível),
 * indicando que novas tentativas de processamento não devem ser realizadas.
 */
public class UnprocessableDocumentException extends RuntimeException {

    public UnprocessableDocumentException(String message) {
        super(message);
    }
}
