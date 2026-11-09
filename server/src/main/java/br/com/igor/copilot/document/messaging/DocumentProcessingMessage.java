package br.com.igor.copilot.document.messaging;

import java.util.UUID;

/**
 * Payload JSON publicado na fila RabbitMQ para solicitar a ingestão assíncrona de um documento.
 */
public record DocumentProcessingMessage(
        UUID documentId
) {
}
