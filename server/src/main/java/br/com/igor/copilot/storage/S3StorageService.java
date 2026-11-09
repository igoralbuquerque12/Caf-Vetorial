package br.com.igor.copilot.storage;

import java.io.InputStream;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

/**
 * Implementação de {@link StorageService} integrada ao Amazon S3 via AWS SDK v2.
 */
@Service
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final AwsProperties props;

    public S3StorageService(S3Client s3Client, AwsProperties props) {
        this.s3Client = s3Client;
        this.props = props;
    }

    @Override
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
    }

    @Override
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
    }

    @Override
    public void delete(String key) {
        try {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(props.s3Bucket())
                    .key(key)
                    .build();
            s3Client.deleteObject(request);
        } catch (SdkException e) {
            throw new StorageException("Falha ao remover arquivo do S3: " + key, e);
        }
    }
}
