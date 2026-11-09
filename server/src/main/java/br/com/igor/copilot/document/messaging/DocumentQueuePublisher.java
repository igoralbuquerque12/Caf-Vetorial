package br.com.igor.copilot.document.messaging;

import br.com.igor.copilot.document.DocumentStatusService;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpException;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

/**
 * Publica mensagens de processamento de documentos no RabbitMQ e marca o documento como falha caso o broker esteja inacessível.
 */
@Component
public class DocumentQueuePublisher {

    private static final Logger log = LoggerFactory.getLogger(DocumentQueuePublisher.class);

    private final RabbitTemplate rabbitTemplate;
    private final MessagingProperties props;
    private final DocumentStatusService statusService;

    public DocumentQueuePublisher(
            RabbitTemplate rabbitTemplate,
            MessagingProperties props,
            DocumentStatusService statusService
    ) {
        this.rabbitTemplate = rabbitTemplate;
        this.props = props;
        this.statusService = statusService;
    }

    public void publish(UUID documentId) {
        MessagingProperties.DocumentQueue d = props.document();
        try {
            rabbitTemplate.convertAndSend(d.exchange(), d.routingKey(), new DocumentProcessingMessage(documentId));
        } catch (AmqpException e) {
            log.error("Falha ao publicar documento {} na fila RabbitMQ", documentId, e);
            statusService.markFailed(documentId, "Não foi possível enfileirar o documento para processamento.");
        }
    }
}
