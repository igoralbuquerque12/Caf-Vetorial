package br.com.igor.copilot.storage;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Propriedades tipadas para integração com a AWS e o serviço de armazenamento S3.
 */
@Validated
@ConfigurationProperties(prefix = "app.aws")
public record AwsProperties(
        @NotBlank(message = "A região da AWS é obrigatória")
        String region,

        @NotBlank(message = "O nome do bucket S3 é obrigatório")
        String s3Bucket,

        String s3Endpoint
) {
}
