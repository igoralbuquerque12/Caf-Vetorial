package br.com.igor.copilot.document.messaging;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas para configuração das exchanges, filas e routing keys do RabbitMQ.
 */
@Validated
@ConfigurationProperties(prefix = "app.messaging")
public record MessagingProperties(
        @Valid
        @NotNull(message = "A configuração da fila de documentos é obrigatória")
        DocumentQueue document
) {

    public record DocumentQueue(
            @NotBlank(message = "O nome da exchange é obrigatório")
            String exchange,

            @NotBlank(message = "A routing key é obrigatória")
            String routingKey,

            @NotBlank(message = "O nome da fila principal é obrigatório")
            String queue,

            @NotBlank(message = "O nome da dead-letter exchange é obrigatório")
            String deadLetterExchange,

            @NotBlank(message = "O nome da dead-letter queue é obrigatório")
            String deadLetterQueue
    ) {
    }
}
