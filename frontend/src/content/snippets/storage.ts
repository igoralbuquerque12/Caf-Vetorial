import type { Snippet } from '../../flows/types'

export const s3ClientConfig: Snippet = {
  language: 'java',
  code: `@Configuration
public class S3Config {

    @Bean
    public S3Client s3Client(AwsProperties props) {
        S3ClientBuilder builder = S3Client.builder().region(Region.of(props.region()));
        // Endpoint customizado (ex.: MinIO/LocalStack) só se configurado:
        if (StringUtils.hasText(props.s3Endpoint())) {
            builder.endpointOverride(URI.create(props.s3Endpoint())).forcePathStyle(true);
        }
        return builder.build(); // credenciais: cadeia padrão da AWS (~/.aws/credentials)
    }
}`,
  highlight: [5, 11],
}

export const s3Upload: Snippet = {
  language: 'java',
  code: `@Override
public void upload(String key, InputStream content, long contentLength, String contentType) {
    try {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(props.s3Bucket())
                .key(key)
                .contentType(contentType)
                .contentLength(contentLength)
                .build();
        s3Client.putObject(request, RequestBody.fromInputStream(content, contentLength));
    } catch (SdkException e) {
        throw new StorageException("Falha ao enviar arquivo para o S3: " + key, e);
    }
}`,
  highlight: [4, 10],
}

export const s3Download: Snippet = {
  language: 'java',
  code: `@Override
public byte[] download(String key) {
    try {
        GetObjectRequest request = GetObjectRequest.builder()
                .bucket(props.s3Bucket())
                .key(key)
                .build();
        return s3Client.getObjectAsBytes(request).asByteArray();
    } catch (SdkException e) {
        throw new StorageException("Falha ao baixar arquivo do S3: " + key, e);
    }
}`,
  highlight: [8, 8],
}
