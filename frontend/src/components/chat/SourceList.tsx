import { useState } from 'react'
import type { SourceReference } from '../../api/types'

export function SourceList({ sources }: { sources: SourceReference[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  if (sources.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-cream-muted">Fontes do documento:</span>
        {sources.map((src, idx) => {
          const active = openIndex === idx
          const pageLabel = src.page != null ? `p. ${src.page}` : `trecho ${idx + 1}`
          const pct = src.score != null ? Math.max(0, Math.min(100, Math.round(src.score * 100))) : null
          return (
            <button
              key={idx}
              type="button"
              aria-expanded={active}
              onClick={() => setOpenIndex(active ? null : idx)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold cursor-pointer transition-colors ${
                active ? 'border-cream bg-navy text-cream' : 'border-track bg-abyss text-cream hover:border-cream-muted'
              }`}
            >
              <span>{pageLabel}</span>
              {pct != null && (
                <span className="inline-flex items-center gap-1.5 text-cream-muted" title={`Similaridade: ${pct}%`}>
                  <span aria-hidden="true" className="inline-block h-1.5 w-10 overflow-hidden rounded-full bg-track">
                    <span style={{ width: `${pct}%` }} className="block h-full bg-ok" />
                  </span>
                  <span>{pct}%</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {openIndex != null && sources[openIndex] && (
        <div className="rounded-control border border-track bg-abyss p-3 text-sm text-cream">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs text-cream-muted">
            <span>
              {sources[openIndex].page != null ? `Página ${sources[openIndex].page}` : 'Página não informada'}
              {sources[openIndex].chunkIndex != null ? `, chunk ${sources[openIndex].chunkIndex}` : ''}
            </span>
            {sources[openIndex].score != null && (
              <span>Score de similaridade: {sources[openIndex].score.toFixed(2)}</span>
            )}
          </div>
          <p className="prose-copilot text-cream-muted">“{sources[openIndex].excerpt}”</p>
        </div>
      )}
    </div>
  )
}
