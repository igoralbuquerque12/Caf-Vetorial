package br.com.igor.copilot.document.ingestion;

import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configura o {@link TokenTextSplitter} utilizado para dividir páginas de documentos em chunks de tokens.
 */
@Configuration
public class IngestionConfig {

    @Bean
    public TokenTextSplitter tokenTextSplitter(IngestionProperties props) {
        return TokenTextSplitter.builder()
                .withChunkSize(props.chunkSize())
                .withMinChunkSizeChars(props.minChunkSizeChars())
                .withMinChunkLengthToEmbed(5)
                .withMaxNumChunks(10000)
                .withKeepSeparator(true)
                .build();
    }
}
