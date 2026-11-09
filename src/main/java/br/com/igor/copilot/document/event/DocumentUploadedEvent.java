package br.com.igor.copilot.document.event;

import java.util.UUID;

/**
 * Evento interno publicado dentro da transação logo após o registro inicial de um documento.
 */
public record DocumentUploadedEvent(
        UUID documentId
) {
}
