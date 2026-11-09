package br.com.igor.copilot.document.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Declarables;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Declara a topologia AMQP (exchanges, filas, DLQ e bindings) e o conversor JSON para mensagens de documentos.
 * <ul>
 *   <li>O {@code RabbitAdmin} registrado pela autoconfiguração do Spring Boot detecta o bean {@link Declarables}
 *       e cria automaticamente todas as exchanges, filas e bindings no broker na primeira conexão.</li>
 *   <li>O bean {@link MessageConverter} é aplicado automaticamente pela autoconfiguração tanto ao
 *       {@code RabbitTemplate} (publicação) quanto aos containers de {@code @RabbitListener} (consumo).</li>
 * </ul>
 */
@Configuration
public class DocumentMessagingConfig {

    @Bean
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
    }

    @Bean
    public MessageConverter jacksonMessageConverter(ObjectMapper objectMapper) {
        return new Jackson2JsonMessageConverter(objectMapper);
    }
}
