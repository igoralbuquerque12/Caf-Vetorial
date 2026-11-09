package br.com.igor.copilot.storage;

import java.net.URI;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;

/**
 * Configura o cliente oficial {@link S3Client} do AWS SDK v2.
 * <p>
 * As credenciais são resolvidas pelo {@code DefaultCredentialsProvider} do AWS SDK (variáveis de ambiente
 * reais do sistema operacional, {@code ~/.aws/credentials} configurado via {@code aws configure} ou IAM Role).
 * Elas não devem ser colocadas no arquivo {@code .env}, pois o {@code spring.config.import} converte o conteúdo
 * do {@code .env} em propriedades internas do Spring, que não são visíveis como variáveis de ambiente do SO
 * para o {@code DefaultCredentialsProvider}.
 */
@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client(AwsProperties props) {
        S3ClientBuilder builder = S3Client.builder().region(Region.of(props.region()));
        if (StringUtils.hasText(props.s3Endpoint())) {
            builder.endpointOverride(URI.create(props.s3Endpoint())).forcePathStyle(true);
        }
        return builder.build();
    }
}
