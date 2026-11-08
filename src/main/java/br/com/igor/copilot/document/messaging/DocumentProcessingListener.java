package br.com.igor.copilot.document.messaging;

import br.com.igor.copilot.document.DocumentStatusService;
import br.com.igor.copilot.document.ingestion.DocumentIngestionService;
import br.com.igor.copilot.document.ingestion.UnprocessableDocumentException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

/**
 * Worker AMQP que consome mensagens da fila de documentos e aciona o pipeline de ingestão RAG.
 * <ul>
 *   <li><b>Semântica <i>at-least-once</i>:</b> o RabbitMQ garante entrega pelo menos uma vez, portanto a mesma
 *       mensagem pode ser entregue novamente em caso de falha de rede ou reinício; por isso o pipeline de
 *       ingestão é idempotente.</li>
 *   <li><b>Erro permanente ({@link UnprocessableDocumentException}):</b> marca o documento como {@code FAILED}
 *       e retorna normalmente para confirmar a mensagem (<i>ack</i>), evitando enviá-la inutilmente para a DLQ.</li>
 *   <li><b>Erro inesperado ({@link RuntimeException}):</b> marca o documento como {@code FAILED} e lança
 *       {@link AmqpRejectAndDontRequeueException} (<i>nack</i> com {@code requeue=false}), encaminhando a mensagem
 *       para a Dead-Letter Queue (DLQ) para inspeção.</li>
 *   <li><b>Retentativas de rede:</b> tentativas extras em falhas transitórias ficam delegadas aos próprios clientes
 *       ({@code spring.ai.retry} para a OpenAI e política padrão de retry do AWS SDK para o S3), e não ao listener.</li>
 * </ul>
 */
@Component
public class DocumentProcessingListener {

    private static final Logger log = LoggerFactory.getLogger(DocumentProcessingListener.class);

    private final DocumentIngestionService ingestionService;
    private final DocumentStatusService statusService;

    public DocumentProcessingListener(
            DocumentIngestionService ingestionService,
            DocumentStatusService statusService
    ) {
        this.ingestionService = ingestionService;
        this.statusService = statusService;
    }

    @RabbitListener(queues = "${app.messaging.document.queue}")
    public void onMessage(DocumentProcessingMessage message) {
        UUID documentId = message.documentId();
        try {
            ingestionService.ingest(documentId);
        } catch (UnprocessableDocumentException e) {
            log.warn("Documento {} não processável: {}", documentId, e.getMessage());
            statusService.markFailed(documentId, e.getMessage());
            // retorna normalmente: a mensagem é confirmada (ack); repetir não resolveria o problema
        } catch (RuntimeException e) {
            log.error("Falha ao processar documento {}", documentId, e);
            statusService.markFailed(documentId, "Falha ao processar o documento. Tente enviar novamente.");
            throw new AmqpRejectAndDontRequeueException("Falha ao processar documento " + documentId, e);
        }
    }
}
