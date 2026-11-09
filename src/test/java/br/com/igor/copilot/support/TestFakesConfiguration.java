package br.com.igor.copilot.support;

import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

/**
 * Configuração de testes que substitui o armazenamento S3 e o cliente de embeddings da OpenAI por implementações locais.
 */
@TestConfiguration(proxyBeanMethods = false)
public class TestFakesConfiguration {

    @Bean
    @Primary
    public InMemoryStorageService inMemoryStorageService() {
        return new InMemoryStorageService();
    }

    @Bean
    @Primary
    public EmbeddingModel fakeEmbeddingModel() {
        return new FakeEmbeddingModel();
    }
}
