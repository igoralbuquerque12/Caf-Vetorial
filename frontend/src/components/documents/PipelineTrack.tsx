import type { DocumentStatus } from '../../api/types'
import { pipelineStationsFor, type StationState } from './pipelineStations'

const DOT_CLASS: Record<StationState, string> = {
  done: 'bg-ok border-ok',
  current: 'bg-busy border-busy',
  upcoming: 'bg-abyss border-track',
  failed: 'bg-fail border-fail',
}

const TEXT_CLASS: Record<StationState, string> = {
  done: 'text-cream',
  current: 'text-busy font-extrabold',
  upcoming: 'text-cream-muted/70',
  failed: 'text-fail font-extrabold',
}

export function PipelineTrack({
  status,
  chunkCount,
  errorMessage,
}: {
  status: DocumentStatus
  chunkCount?: number | null
  errorMessage?: string | null
}) {
  const stations = pipelineStationsFor(status, chunkCount)

  return (
    <div className="flex flex-col gap-1.5" aria-label={`Trilho do documento: ${status}`}>
      <ol className="m-0 flex flex-wrap items-center gap-1.5 p-0 list-none">
        {stations.map((station, idx) => (
          <li key={station.id} className="inline-flex items-center gap-1.5">
            <span
              data-testid={`station-${station.id}`}
              data-state={station.state}
              className={`inline-flex items-center gap-1.5 text-xs ${TEXT_CLASS[station.state]}`}
            >
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full border ${DOT_CLASS[station.state]}`} />
              <span>{station.label}</span>
            </span>
            {idx < stations.length - 1 && (
              <span
                aria-hidden="true"
                className={`inline-block h-0.5 w-3 ${station.state === 'done' ? 'bg-ok/70' : 'bg-track'}`}
              />
            )}
          </li>
        ))}
      </ol>

      {status === 'FAILED' && (
        <div
          role="status"
          data-testid="pipeline-failed-marker"
          className="mt-1 rounded-control border border-fail/50 bg-fail/10 px-2.5 py-1.5 text-xs text-fail"
        >
          <span className="font-extrabold">Falha no processamento: </span>
          <span>{errorMessage || 'Não foi possível processar o documento.'}</span>
        </div>
      )}
    </div>
  )
}
