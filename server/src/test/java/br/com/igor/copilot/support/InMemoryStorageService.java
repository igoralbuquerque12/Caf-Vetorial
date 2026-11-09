package br.com.igor.copilot.support;

import br.com.igor.copilot.storage.StorageException;
import br.com.igor.copilot.storage.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Implementação de {@link StorageService} em memória para testes automatizados, evitando chamadas reais ao S3.
 */
public class InMemoryStorageService implements StorageService {

    private final Map<String, byte[]> store = new ConcurrentHashMap<>();

    @Override
    public void upload(String key, InputStream content, long contentLength, String contentType) {
        try {
            store.put(key, content.readAllBytes());
        } catch (IOException e) {
            throw new StorageException("Falha ao ler stream em memória: " + key, e);
        }
    }

    @Override
    public byte[] download(String key) {
        byte[] bytes = store.get(key);
        if (bytes == null) {
            throw new StorageException("Objeto não encontrado em memória: " + key);
        }
        return bytes;
    }

    @Override
    public void delete(String key) {
        store.remove(key);
    }

    public boolean contains(String key) {
        return store.containsKey(key);
    }

    public int size() {
        return store.size();
    }
}
