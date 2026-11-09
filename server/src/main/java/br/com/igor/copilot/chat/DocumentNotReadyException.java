package br.com.igor.copilot.chat;

import br.com.igor.copilot.document.DocumentStatus;

/**
 * Exceção lançada quando o usuário tenta fazer perguntas sobre um documento que ainda não concluiu a ingestão ({@code COMPLETED}).
 */
public class DocumentNotReadyException extends RuntimeException {

    private final DocumentStatus status;

    public DocumentNotReadyException(DocumentStatus status) {
        super("O documento ainda não está pronto para perguntas (status: %s)".formatted(status));
        this.status = status;
    }

    public DocumentStatus getStatus() {
        return status;
    }
}
