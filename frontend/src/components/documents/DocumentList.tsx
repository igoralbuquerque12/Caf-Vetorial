import { FileText } from 'lucide-react'
import type { DocumentResponse } from '../../api/types'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { documentStatusLabel } from '../ui/statusHelpers'
import { PipelineTrack } from './PipelineTrack'

export function DocumentList({
  documents,
  selectedId,
  loading,
  error,
  onSelect,
  onRetry,
}: {
  documents: DocumentResponse[]
  selectedId: string | null
  loading: boolean
  error: string | null
  onSelect: (doc: DocumentResponse) => void
  onRetry: () => void
}) {
  if (loading && documents.length === 0) {
    return (
      <div aria-live="polite" className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-xs text-slate-400">
        Carregando seus documentos…
      </div>
    )
  }

  if (error && documents.length === 0) {
    return (
      <div
        role="alert"
        className="flex flex-col gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-slate-100"
      >
        <p className="text-red-300">{error}</p>
        <div>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 text-xs text-slate-400">
        Nenhum documento ainda. Envie um regulamento em PDF para começar.
      </div>
    )
  }

  return (
    <ul
      aria-live="polite"
      className="m-0 flex flex-col divide-y divide-slate-800/80 p-0 list-none rounded-xl border border-slate-800/90 bg-slate-950/40 overflow-hidden"
    >
      {documents.map((doc) => {
        const badge = documentStatusLabel(doc.status, doc.chunkCount)
        const selected = doc.id === selectedId
        const ready = doc.status === 'COMPLETED'
        return (
          <li key={doc.id}>
            <div
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              onClick={() => onSelect(doc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(doc)
                }
              }}
              className={`flex flex-col gap-2.5 p-3.5 transition-all cursor-pointer border-l-2 ${
                selected
                  ? 'border-l-cyan-400 bg-slate-800/50'
                  : 'border-l-transparent hover:bg-slate-900/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className={`h-4 w-4 shrink-0 ${selected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="truncate text-xs font-semibold text-slate-100" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </div>
                <StatusBadge label={badge.label} tone={badge.tone} />
              </div>

              <PipelineTrack status={doc.status} chunkCount={doc.chunkCount} errorMessage={doc.errorMessage} />

              {ready && (
                <span className="text-[11px] text-slate-400">
                  {selected ? 'Selecionado para a conversa' : 'Clique para conversar sobre este documento'}
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
