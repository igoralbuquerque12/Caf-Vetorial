package br.com.igor.copilot.chat;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configura os beans de infraestrutura do módulo de chat RAG ({@link ChatPrompts}, {@link ChatClient}
 * e {@link QuestionAnswerAdvisor}).
 * <ul>
 *   <li><b>{@link ChatClient.Builder}:</b> é registrado automaticamente pela autoconfiguração do Spring AI,
 *       já conectado ao bean {@code ChatModel} ativo (OpenAI em produção ou fake nos testes).</li>
 *   <li><b>O que é um Advisor:</b> no Spring AI, um <i>Advisor</i> funciona de forma análoga a um
 *       {@code Interceptor} do NestJS — ele intercepta a chamada antes de ir ao LLM (buscando trechos no
 *       {@link VectorStore} e injetando-os no prompt do usuário) e depois que a resposta volta (anexando os
 *       documentos recuperados nos metadados da resposta).</li>
 *   <li><b>Trade-offs de {@code topK} e {@code similarityThreshold}:</b> um {@code topK} maior traz mais contexto,
 *       mas aumenta o consumo de tokens e o risco de ruído; já um {@code similarityThreshold} mais alto aumenta
 *       a precisão semântica dos trechos aceitos, porém pode descartar trechos relevantes caso a pergunta use
 *       vocabulário muito distante do documento.</li>
 * </ul>
 */
@Configuration
public class ChatConfig {

    @Bean
    public ChatPrompts chatPrompts(ChatPromptsLoader loader, ChatProperties props) {
        return loader.load(props);
    }

    @Bean
    public ChatClient documentChatClient(ChatClient.Builder builder, ChatPrompts prompts) {
        return builder.defaultSystem(prompts.systemPrompt()).build();
    }

    @Bean
    public QuestionAnswerAdvisor questionAnswerAdvisor(
            VectorStore vectorStore,
            ChatProperties props,
            ChatPrompts prompts
    ) {
        return QuestionAnswerAdvisor.builder(vectorStore)
                .searchRequest(SearchRequest.builder()
                        .topK(props.topK())
                        .similarityThreshold(props.similarityThreshold())
                        .build())
                .promptTemplate(prompts.ragTemplate())
                .build();
    }
}
