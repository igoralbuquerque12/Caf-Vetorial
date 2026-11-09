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
    <section
      aria-label="Mapa do sistema"
      className="flex flex-col gap-4 rounded-xl border border-slate-800/90 bg-slate-900/70 p-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Mapa do sistema</h2>
        <p className="prose-copilot mt-1 text-sm text-slate-400">
          O navegador conversa apenas com a API Spring Boot por HTTP. Todo o resto acontece do lado do servidor, e o{' '}
          <strong>worker roda dentro do mesmo processo da API</strong>, acionado por <code>@RabbitListener</code>. Clique
          em qualquer bloco para ir direto à explicação.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-12 items-stretch">
        {/* Navegador / SPA */}
        <div className="lg:col-span-3 flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-950/60 p-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Navegador</span>
            <h3 className="mt-1 text-sm font-semibold text-white">SPA React + Vite</h3>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Envia JSON e multipart com <code>Authorization: Bearer</code> para <code>VITE_API_URL</code>.
            </p>
          </div>
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-400">
            Observado pelo cliente: status HTTP, headers expostos (<code>Location</code>) e tempo de resposta.
          </div>
        </div>

        {/* Processo da API Spring Boot */}
        <div className="lg:col-span-5 flex flex-col gap-3 rounded-xl border border-cyan-400/30 bg-slate-900/90 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Processo único: API Spring Boot</h3>
            <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
              Mesma JVM (API + Worker)
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="block text-xs font-semibold text-slate-200">Segurança</span>
              <span className="mt-0.5 block text-[11px] text-slate-400 leading-snug">
                CorsFilter, BearerTokenAuthenticationFilter, JwtDecoder
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="block text-xs font-semibold text-slate-200">Controllers</span>
              <span className="mt-0.5 block text-[11px] text-slate-400 leading-snug">
                User, Auth, Document, Chat + GlobalExceptionHandler
              </span>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
              <span className="block text-xs font-semibold text-slate-200">Services</span>
              <span className="mt-0.5 block text-[11px] text-slate-400 leading-snug">
                Regras, transações curtas e publicação AFTER_COMMIT
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectSection('fila')}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-700/80 bg-slate-950/80 p-3 text-left hover:border-cyan-400/50 cursor-pointer transition-all"
          >
            <div>
              <span className="block font-mono text-xs font-semibold text-cyan-400">
                Worker interno: DocumentProcessingListener (@RabbitListener)
              </span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Roda numa pool de threads do próprio processo Spring Boot; consome a fila, baixa do S3 e vetoriza.
              </span>
            </div>
            <span className="shrink-0 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-300">
              Ver fila
            </span>
          </button>
        </div>

        {/* Sistemas externos clicáveis */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(
            [
              {
                id: 'fila' as const,
                glyph: 'rabbitmq' as const,
                title: 'RabbitMQ',
                desc: 'Exchange, fila durável, ack manual/auto e DLQ para falhas inesperadas.',
              },
              {
                id: 's3' as const,
                glyph: 's3' as const,
                title: 'AWS S3',
                desc: 'Upload fora da transação e compensação automática se o commit falhar.',
              },
              {
                id: 'vetores' as const,
                glyph: 'postgres' as const,
                title: 'PostgreSQL + pgvector',
                desc: 'Tabelas relacionais + vector_store com índices HNSW e GIN.',
              },
              {
                id: 'prompts' as const,
                glyph: 'openai' as const,
                title: 'OpenAI e Prompts',
                desc: 'Embeddings (1536d), chat e validação dos templates no boot.',
              },
            ] as const
          ).map((item) => {
            const active = activeSection === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-pressed={active}
                className={`flex flex-col justify-between rounded-xl border p-3.5 text-left cursor-pointer transition-all ${
                  active
                    ? 'border-cyan-400/60 bg-cyan-400/5 text-white'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/80'
                }`}
              >
                <div className="flex items-center gap-2 text-slate-100">
                  <span className={active ? 'text-cyan-400' : 'text-slate-400'}>
                    <ExternalGlyph system={item.glyph} size={15} />
                  </span>
                  <span className="text-xs font-semibold">{item.title}</span>
                </div>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
