package br.com.igor.copilot.support;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;

/**
 * Modelo de embedding determinístico para testes automatizados, gerando vetores normalizados de 1536 dimensões
 * sem realizar chamadas externas à API da OpenAI.
 */
public class FakeEmbeddingModel implements EmbeddingModel {

    private static final int DIMENSIONS = 1536;

    @Override
    public EmbeddingResponse call(EmbeddingRequest request) {
        List<String> instructions = request.getInstructions();
        List<Embedding> embeddings = new ArrayList<>(instructions.size());
        for (int i = 0; i < instructions.size(); i++) {
            embeddings.add(new Embedding(embed(instructions.get(i)), i));
        }
        return new EmbeddingResponse(embeddings);
    }

    @Override
    public float[] embed(Document document) {
        return embed(document.getText());
    }

    @Override
    public float[] embed(String text) {
        Random random = new Random(text != null ? text.hashCode() : 0L);
        float[] vector = new float[DIMENSIONS];
        double sumSquares = 0.0;
        for (int i = 0; i < DIMENSIONS; i++) {
            float val = (random.nextFloat() * 2.0f) - 1.0f;
            vector[i] = val;
            sumSquares += (double) val * val;
        }
        float norm = (float) Math.sqrt(sumSquares);
        if (norm > 0.0f) {
            for (int i = 0; i < DIMENSIONS; i++) {
                vector[i] /= norm;
            }
        }
        return vector;
    }

    @Override
    public int dimensions() {
        return DIMENSIONS;
    }
}
