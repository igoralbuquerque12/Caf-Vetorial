import type { Snippet } from '../../flows/types'

export const jsonConverter: Snippet = {
  language: 'java',
  code: `@Bean
public MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
    return new Jackson2JsonMessageConverter(objectMapper);
}

// A mensagem trafega como JSON, não como objeto Java serializado:
public record DocumentProcessingMessage(UUID documentId) {
}
// -> {"documentId":"3f2a..."}  (só o id: o worker busca o resto no banco)`,
  highlight: [1, 4],
}

export const topology: Snippet = {
  language: 'java',
  code: `@Bean
public Declarables documentProcessingTopology(MessagingProperties props) {
    MessagingProperties.DocumentQueue d = props.document();
    DirectExchange exchange = new DirectExchange(d.exchange(), true, false);
    DirectExchange deadLetterExchange = new DirectExchange(d.deadLetterExchange(), true, false);
    Queue queue = QueueBuilder.durable(d.queue())
            .deadLetterExchange(d.deadLetterExchange())
            .deadLetterRoutingKey(d.deadLetterQueue())
            .build();
    Queue deadLetterQueue = QueueBuilder.durable(d.deadLetterQueue()).build();
    return new Declarables(
            exchange, deadLetterExchange, queue, deadLetterQueue,
            BindingBuilder.bind(queue).to(exchange).with(d.routingKey()),
            BindingBuilder.bind(deadLetterQueue).to(deadLetterExchange).with(d.deadLetterQueue()));
}`,
  highlight: [6, 9],
}

export const afterCommitListener: Snippet = {
  language: 'java',
  code: `@Component
public class DocumentUploadedEventListener {

    private final DocumentQueuePublisher publisher;

    public DocumentUploadedEventListener(DocumentQueuePublisher publisher) {
        this.publisher = publisher;
    }

    // Só roda DEPOIS do commit: o worker nunca recebe um id que ainda não existe no banco.
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDocumentUploaded(DocumentUploadedEvent event) {
        publisher.publish(event.documentId());
    }
}`,
  highlight: [10, 13],
}

export const publisher: Snippet = {
  language: 'java',
  code: `public void publish(UUID documentId) {
    MessagingProperties.DocumentQueue d = props.document();
    try {
        rabbitTemplate.convertAndSend(
                d.exchange(), d.routingKey(), new DocumentProcessingMessage(documentId));
    } catch (AmqpException e) {
        log.error("Falha ao publicar documento {} na fila RabbitMQ", documentId, e);
        statusService.markFailed(documentId,
                "Não foi possível enfileirar o documento para processamento.");
    }
}`,
  highlight: [3, 5],
}

export const workerListener: Snippet = {
  language: 'java',
  code: `@RabbitListener(queues = "\${app.messaging.document.queue}")
public void onMessage(DocumentProcessingMessage message) {
    UUID documentId = message.documentId();
    try {
        ingestionService.ingest(documentId);
    } catch (UnprocessableDocumentException e) {
        statusService.markFailed(documentId, e.getMessage());
        // retorna normalmente: ack. Repetir não resolveria (ex.: PDF sem texto).
    } catch (RuntimeException e) {
        statusService.markFailed(documentId, "Falha ao processar o documento. Tente enviar novamente.");
        throw new AmqpRejectAndDontRequeueException("Falha ao processar " + documentId, e);
        // rejeita sem reenfileirar: a mensagem vai para a DLQ
    }
}`,
  highlight: [6, 12],
}

export const listenerYaml: Snippet = {
  language: 'yaml',
  code: `spring:
  rabbitmq:
    listener:
      simple:
        acknowledge-mode: auto        # ack ao retornar; nack ao lançar exceção
        default-requeue-rejected: false  # falha NÃO volta para a fila: vai para a DLQ
        prefetch: 1                   # uma mensagem por vez por consumidor
        concurrency: 1
        max-concurrency: 3`,
  highlight: [5, 7],
}

export const messagingYaml: Snippet = {
  language: 'yaml',
  code: `app:
  messaging:
    document:
      exchange: document.exchange
      routing-key: document.process
      queue: document.process.queue
      dead-letter-exchange: document.dlx
      dead-letter-queue: document.process.dlq`,
  highlight: [4, 6],
}
