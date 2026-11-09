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
 * <p>
 * Os vetores gerados possuem um componente base dominante ({@code 1.0f}) somado a um pequeno ruído determinístico
 * ({@code 0.01f * ruído}) derivado de {@code text.hashCode()}, garantindo similaridade de cosseno acima de 0,95
 * entre quaisquer dois textos. Isso é intencional: vetores puramente aleatórios em 1536 dimensões são quase
 * ortogonais (cosseno próximo de zero) e seriam descartados de forma imprevisível pelo limiar de similaridade.
 * Com vetores altamente similares, quem determina o que entra ou sai do contexto nos testes é exclusivamente
 * o filtro de metadados ({@code document_id} e {@code owner_id}).
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
            float noise = (random.nextFloat() * 2.0f) - 1.0f;
            float val = 1.0f + (0.01f * noise);
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
