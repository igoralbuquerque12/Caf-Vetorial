package br.com.igor.copilot.storage;

import java.io.InputStream;

/**
 * Contrato de armazenamento binário de objetos, permitindo substituir o S3 por implementações em memória nos testes.
 */
public interface StorageService {

    void upload(String key, InputStream content, long contentLength, String contentType);

    byte[] download(String key);

    void delete(String key);
}
