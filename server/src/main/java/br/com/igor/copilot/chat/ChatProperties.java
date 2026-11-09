package br.com.igor.copilot.chat;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.core.io.Resource;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas para configuração do módulo de chat RAG ({@code app.chat}).
 * <ul>
 *   <li><b>Conversão automática para {@link Resource}:</b> o Spring converte automaticamente strings com prefixo
 *       {@code classpath:...} (dentro do jar) ou {@code file:...} (sistema de arquivos externo) para instâncias
 *       de {@link Resource}.</li>
 *   <li><b>Personalização sem recompilar:</b> para usar um prompt externo, defina a variável de ambiente
 *       {@code APP_CHAT_SYSTEM_PROMPT=file:./prompts/system-prompt.custom.st} ou passe o argumento de linha de
 *       comando {@code --app.chat.system-prompt=file:./prompts/system-prompt.custom.st}. Como os prompts são
 *       lidos e validados na inicialização (boot), é necessário reiniciar a aplicação após alterá-los.</li>
 * </ul>
 */
@Validated
@ConfigurationProperties(prefix = "app.chat")
public record ChatProperties(
        @NotNull(message = "O recurso do system prompt é obrigatório")
        Resource systemPrompt,

        @NotNull(message = "O recurso do template de RAG é obrigatório")
        Resource ragPrompt,

        @Min(value = 1, message = "O topK deve ser no mínimo 1")
        @Max(value = 20, message = "O topK deve ser no máximo 20")
        int topK,

        @DecimalMin(value = "0.0", message = "O limiar de similaridade deve ser no mínimo 0.0")
        @DecimalMax(value = "1.0", message = "O limiar de similaridade deve ser no máximo 1.0")
        double similarityThreshold
) {
}
