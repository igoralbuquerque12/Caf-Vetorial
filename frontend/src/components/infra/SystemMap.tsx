import { ExternalGlyph } from '../metro/Station'

export type InsideSectionId = 'fila' | 's3' | 'vetores' | 'prompts'

export function SystemMap({
  activeSection,
  onSelectSection,
}: {
  activeSection: InsideSectionId
  onSelectSection: (section: InsideSectionId) => void
}) {
  return (
    <section aria-label="Mapa do sistema" className="flex flex-col gap-4 rounded-panel border border-track bg-navy p-5">
      <div>
        <h2 className="text-xl">Mapa do sistema</h2>
        <p className="prose-copilot mt-1 text-sm text-cream-muted">
          O navegador conversa apenas com a API Spring Boot por HTTP. Todo o resto acontece do lado do servidor, e o{' '}
          <strong>worker roda dentro do mesmo processo da API</strong>, acionado por <code>@RabbitListener</code>. Clique
          em qualquer bloco para ir direto à explicação.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 items-stretch">
        {/* Navegador / SPA */}
        <div className="lg:col-span-3 flex flex-col justify-between rounded-panel border border-track bg-abyss p-4">
          <div>
            <span className="text-xs font-semibold text-cream-muted">Navegador</span>
            <h3 className="mt-1 text-base">SPA React + Vite</h3>
            <p className="mt-1.5 text-sm text-cream-muted">
              Envia JSON e multipart com <code>Authorization: Bearer</code> para <code>VITE_API_URL</code>.
            </p>
          </div>
          <div className="mt-3 rounded-control border border-track bg-navy px-3 py-2 text-xs text-cream-muted">
            Observado pelo cliente: status HTTP, headers expostos (<code>Location</code>) e tempo de resposta.
          </div>
        </div>

        {/* Processo da API Spring Boot */}
        <div className="lg:col-span-5 flex flex-col gap-3 rounded-panel border border-cream/50 bg-navy-raised p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base">Processo único: API Spring Boot</h3>
            <span className="rounded-full border border-track bg-navy px-2.5 py-0.5 text-xs font-semibold text-cream">
              Mesma JVM (API + Worker)
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-control border border-track bg-navy p-2.5">
              <span className="block text-xs font-extrabold text-cream">Segurança</span>
              <span className="mt-0.5 block text-xs text-cream-muted">
                CorsFilter, BearerTokenAuthenticationFilter, JwtDecoder
              </span>
            </div>
            <div className="rounded-control border border-track bg-navy p-2.5">
              <span className="block text-xs font-extrabold text-cream">Controllers</span>
              <span className="mt-0.5 block text-xs text-cream-muted">
                User, Auth, Document, Chat + GlobalExceptionHandler
              </span>
            </div>
            <div className="rounded-control border border-track bg-navy p-2.5">
              <span className="block text-xs font-extrabold text-cream">Services</span>
              <span className="mt-0.5 block text-xs text-cream-muted">
                Regras, transações curtas e publicação AFTER_COMMIT
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectSection('fila')}
            className="flex items-center justify-between gap-3 rounded-control border border-busy/50 bg-navy p-3 text-left hover:bg-track cursor-pointer transition-colors"
          >
            <div>
              <span className="block text-sm font-extrabold text-cream">
                Worker interno: DocumentProcessingListener (@RabbitListener)
              </span>
              <span className="mt-0.5 block text-xs text-cream-muted">
                Roda numa pool de threads do próprio processo Spring Boot; consome a fila, baixa do S3 e vetoriza.
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-track bg-navy-raised px-2.5 py-1 text-xs font-semibold text-busy">
              Ver fila
            </span>
          </button>
        </div>

        {/* Sistemas externos clicáveis */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onSelectSection('fila')}
            aria-pressed={activeSection === 'fila'}
            className={`flex flex-col justify-between rounded-panel border p-3.5 text-left cursor-pointer transition-colors ${
              activeSection === 'fila' ? 'border-cream bg-navy-raised' : 'border-track bg-abyss hover:bg-navy-raised'
            }`}
          >
            <div className="flex items-center gap-2 text-cream">
              <ExternalGlyph system="rabbitmq" size={16} />
              <span className="text-sm font-extrabold">RabbitMQ</span>
            </div>
            <p className="mt-1.5 text-xs text-cream-muted">
              Exchange, fila durável, ack manual/auto e DLQ para falhas inesperadas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection('s3')}
            aria-pressed={activeSection === 's3'}
            className={`flex flex-col justify-between rounded-panel border p-3.5 text-left cursor-pointer transition-colors ${
              activeSection === 's3' ? 'border-cream bg-navy-raised' : 'border-track bg-abyss hover:bg-navy-raised'
            }`}
          >
            <div className="flex items-center gap-2 text-cream">
              <ExternalGlyph system="s3" size={16} />
              <span className="text-sm font-extrabold">AWS S3</span>
            </div>
            <p className="mt-1.5 text-xs text-cream-muted">
              Upload fora da transação e compensação automática se o commit falhar.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection('vetores')}
            aria-pressed={activeSection === 'vetores'}
            className={`flex flex-col justify-between rounded-panel border p-3.5 text-left cursor-pointer transition-colors ${
              activeSection === 'vetores' ? 'border-cream bg-navy-raised' : 'border-track bg-abyss hover:bg-navy-raised'
            }`}
          >
            <div className="flex items-center gap-2 text-cream">
              <ExternalGlyph system="postgres" size={16} />
              <span className="text-sm font-extrabold">PostgreSQL + pgvector</span>
            </div>
            <p className="mt-1.5 text-xs text-cream-muted">
              Tabelas relacionais + vector_store com índices HNSW e GIN.
            </p>
          </button>

          <button
            type="button"
            onClick={() => onSelectSection('prompts')}
            aria-pressed={activeSection === 'prompts'}
            className={`flex flex-col justify-between rounded-panel border p-3.5 text-left cursor-pointer transition-colors ${
              activeSection === 'prompts' ? 'border-cream bg-navy-raised' : 'border-track bg-abyss hover:bg-navy-raised'
            }`}
          >
            <div className="flex items-center gap-2 text-cream">
              <ExternalGlyph system="openai" size={16} />
              <span className="text-sm font-extrabold">OpenAI e Prompts</span>
            </div>
            <p className="mt-1.5 text-xs text-cream-muted">
              Embeddings (1536d), chat e validação dos templates no boot.
            </p>
          </button>
        </div>
      </div>
    </section>
  )
}
