import type { DocumentStatus } from '../../api/types'
import { pipelineStationsFor, type StationState } from './pipelineStations'

const DOT_CLASS: Record<StationState, string> = {
  done: 'bg-emerald-400 border-emerald-400',
  current: 'bg-cyan-400 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]',
  upcoming: 'bg-slate-950 border-slate-700',
  failed: 'bg-red-400 border-red-400',
}

const TEXT_CLASS: Record<StationState, string> = {
  done: 'text-slate-200',
  current: 'text-cyan-300 font-semibold',
  upcoming: 'text-slate-500',
  failed: 'text-red-300 font-semibold',
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
              className={`inline-flex items-center gap-1 text-[11px] ${TEXT_CLASS[station.state]}`}
            >
              <span aria-hidden="true" className={`h-2 w-2 shrink-0 rounded-full border ${DOT_CLASS[station.state]}`} />
              <span>{station.label}</span>
            </span>
            {idx < stations.length - 1 && (
              <span
                aria-hidden="true"
                className={`inline-block h-0.5 w-2.5 ${station.state === 'done' ? 'bg-emerald-400/60' : 'bg-slate-800'}`}
              />
            )}
          </li>
        ))}
      </ol>

      {status === 'FAILED' && (
        <div
          role="status"
          data-testid="pipeline-failed-marker"
          className="mt-1 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300"
        >
          <span className="font-semibold">Falha no processamento: </span>
          <span>{errorMessage || 'Não foi possível processar o documento.'}</span>
        </div>
      )}
    </div>
  )
}
