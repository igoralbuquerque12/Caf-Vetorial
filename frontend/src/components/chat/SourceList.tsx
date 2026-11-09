import { useState } from 'react'
import type { SourceReference } from '../../api/types'

export function SourceList({ sources }: { sources: SourceReference[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  if (sources.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Fontes do documento:</span>
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
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-all ${
                active
                  ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                  : 'border-slate-700/80 bg-slate-950/70 text-slate-200 hover:border-slate-600'
              }`}
            >
              <span>{pageLabel}</span>
              {pct != null && (
                <span className="inline-flex items-center gap-1.5 text-slate-400" title={`Similaridade: ${pct}%`}>
                  <span aria-hidden="true" className="inline-block h-1.5 w-8 overflow-hidden rounded-full bg-slate-800">
                    <span style={{ width: `${pct}%` }} className="block h-full bg-emerald-400" />
                  </span>
                  <span>{pct}%</span>
                </span>
              )}
            </button>
          )
        })}
      </div>

      {openIndex != null && sources[openIndex] && (
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-200">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>
              {sources[openIndex].page != null ? `Página ${sources[openIndex].page}` : 'Página não informada'}
              {sources[openIndex].chunkIndex != null ? `, chunk ${sources[openIndex].chunkIndex}` : ''}
            </span>
            {sources[openIndex].score != null && (
              <span>Score de similaridade: {sources[openIndex].score.toFixed(2)}</span>
            )}
          </div>
          <p className="prose-copilot text-slate-300 italic">“{sources[openIndex].excerpt}”</p>
        </div>
      )}
    </div>
  )
}
