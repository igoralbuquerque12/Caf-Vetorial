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
      <div aria-live="polite" className="rounded-panel border border-track bg-abyss/50 p-4 text-sm text-cream-muted">
        Carregando seus documentos…
      </div>
    )
  }

  if (error && documents.length === 0) {
    return (
      <div role="alert" className="flex flex-col gap-2.5 rounded-panel border border-fail/50 bg-fail/10 p-4 text-sm text-cream">
        <p className="text-fail">{error}</p>
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
      <div className="rounded-panel border border-track bg-abyss/50 p-4 text-sm text-cream-muted">
        Nenhum documento ainda. Envie um regulamento em PDF para começar.
      </div>
    )
  }

  return (
    <ul aria-live="polite" className="m-0 flex flex-col divide-y divide-track p-0 list-none rounded-panel border border-track bg-abyss/40 overflow-hidden">
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
              className={`flex flex-col gap-2.5 p-3.5 transition-colors cursor-pointer ${
                selected ? 'bg-navy-raised' : 'hover:bg-navy/70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-cream-muted" />
                  <span className="truncate text-sm font-extrabold text-cream" title={doc.fileName}>
                    {doc.fileName}
                  </span>
                </div>
                <StatusBadge label={badge.label} tone={badge.tone} />
              </div>

              <PipelineTrack status={doc.status} chunkCount={doc.chunkCount} errorMessage={doc.errorMessage} />

              {ready && (
                <span className="text-xs text-cream-muted">
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
