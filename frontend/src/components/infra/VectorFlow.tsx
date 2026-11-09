import * as chat from '../../content/snippets/chat'
import * as vec from '../../content/snippets/vectors'
import { CodeTabs, type CodeTab } from '../code/CodeTabs'

const VECTOR_TABS: CodeTab[] = [
  {
    id: 'ingest',
    label: 'Serviço de ingestão',
    snippet: vec.ingestionIngest,
    note: 'Baixa o PDF, extrai páginas não vazias, divide em chunks, apaga vetores antigos e insere os novos.',
  },
  {
    id: 'sql',
    label: 'SQL dos índices HNSW e GIN',
    snippet: vec.vectorTableSql,
    note: 'HNSW acelera a distância de cosseno (<=>) no vetor de 1536 dimensões; GIN acelera o filtro JSONB por document_id e owner_id.',
  },
  {
    id: 'search',
    label: 'Busca filtrada no chat',
    snippet: chat.chatPgVectorSearch,
    note: 'Combina similaridade semântica com isolamento estrito por documento e dono.',
  },
]

const SAMPLE_METADATA = `{
  "document_id": "8f14e45f-ceea-467f-a8f8-15b92b9e2c11",
  "owner_id": "2c91a0e4-57d1-4c9a-9b0d-61b2f349a001",
  "chunk_index": 4,
  "page_number": 7,
  "file_name": "regulamento-plano-previdencia.pdf"
}`

export function VectorFlow() {
  return (
    <section aria-label="Vetores pgvector e RAG" className="flex flex-col gap-6 rounded-panel border border-track bg-navy p-5">
      <div>
        <h2 className="text-xl">Vetores (pgvector) e busca RAG</h2>
        <p className="prose-copilot mt-1 text-sm text-cream-muted">
          Em vez de um banco vetorial separado, os embeddings moram no próprio PostgreSQL com a extensão{' '}
          <code>vector</code>, ao lado das tabelas <code>users</code> e <code>document_registry</code>.
        </p>
      </div>

      {/* Ilustração: páginas -> chunks -> embeddings -> linhas da vector_store */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-panel border border-track bg-abyss p-3.5">
          <span className="text-xs font-semibold text-cream-muted">1. Páginas</span>
          <p className="mt-1 text-sm font-extrabold text-cream">PagePdfDocumentReader</p>
          <p className="mt-1 text-xs text-cream-muted">
            Extrai 1 <code>Document</code> por página com <code>page_number</code> e descarta páginas em branco.
          </p>
        </div>

        <div className="rounded-panel border border-track bg-abyss p-3.5">
          <span className="text-xs font-semibold text-cream-muted">2. Chunks</span>
          <p className="mt-1 text-sm font-extrabold text-cream">TokenTextSplitter</p>
          <p className="mt-1 text-xs text-cream-muted">
            Quebra em blocos de ~800 tokens (mínimo de 350 caracteres) e acrescenta <code>document_id</code>,{' '}
            <code>owner_id</code> e <code>chunk_index</code>.
          </p>
        </div>

        <div className="rounded-panel border border-track bg-abyss p-3.5">
          <span className="text-xs font-semibold text-cream-muted">3. Embeddings</span>
          <p className="mt-1 text-sm font-extrabold text-cream">text-embedding-3-small</p>
          <p className="mt-1 text-xs text-cream-muted">
            Cada chunk vira um vetor de <code>1536</code> números de ponto flutuante representando seu sentido.
          </p>
        </div>

        <div className="rounded-panel border border-track bg-abyss p-3.5">
          <span className="text-xs font-semibold text-cream-muted">4. Persistência</span>
          <p className="mt-1 text-sm font-extrabold text-cream">Tabela vector_store</p>
          <p className="mt-1 text-xs text-cream-muted">
            Colunas <code>id</code>, <code>content</code>, <code>metadata (JSONB)</code> e{' '}
            <code>embedding VECTOR(1536)</code>.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel border border-track bg-abyss p-4">
          <h3 className="text-base">Exemplo do JSON de metadados em cada linha</h3>
          <pre className="mt-2 overflow-x-auto rounded-control border border-track bg-navy p-3 text-xs text-cream">
            {SAMPLE_METADATA}
          </pre>
        </div>

        <div className="rounded-panel border border-track bg-abyss p-4">
          <h3 className="text-base">A busca no chat: filtro, topK e limiar</h3>
          <p className="prose-copilot mt-1.5 text-sm text-cream-muted">
            Em <code>ChatService.ask</code>, o advisor recebe a expressão{' '}
            <code>document_id == &apos;...&apos; &amp;&amp; owner_id == &apos;...&apos;</code>. O{' '}
            <code>PgVectorStore</code> calcula o embedding da pergunta, filtra pelo JSONB usando o índice{' '}
            <strong>GIN</strong>, ordena pela distância de cosseno usando o índice <strong>HNSW</strong>, traz até{' '}
            <code>topK = 5</code> trechos e descarta qualquer trecho com similaridade abaixo de{' '}
            <code>similarityThreshold = 0.3</code>.
          </p>
        </div>
      </div>

      <CodeTabs tabs={VECTOR_TABS} ariaLabel="Trechos de ingestão e pgvector" />
    </section>
  )
}
