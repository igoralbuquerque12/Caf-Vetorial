import type { DocumentStatus } from '../../api/types'

export type StationState = 'done' | 'current' | 'upcoming' | 'failed'

export interface PipelineStation {
  id: 's3' | 'queue' | 'worker' | 'vectorized'
  label: string
  state: StationState
}

/**
 * Mapeia o status do documento para as 4 estações do trilho de ingestão:
 * 1. "Enviado ao S3" (resposta 202)
 * 2. "Na fila" (PENDING)
 * 3. "Worker processando" (PROCESSING)
 * 4. "Vetorizado" (COMPLETED, mostrando o chunkCount)
 */
export function pipelineStationsFor(status: DocumentStatus, chunkCount?: number | null): PipelineStation[] {
  const vectorizedLabel =
    status === 'COMPLETED' && chunkCount != null ? `Vetorizado (${chunkCount})` : 'Vetorizado'

  switch (status) {
    case 'PENDING':
      return [
        { id: 's3', label: 'Enviado ao S3', state: 'done' },
        { id: 'queue', label: 'Na fila', state: 'current' },
        { id: 'worker', label: 'Worker processando', state: 'upcoming' },
        { id: 'vectorized', label: vectorizedLabel, state: 'upcoming' },
      ]
    case 'PROCESSING':
      return [
        { id: 's3', label: 'Enviado ao S3', state: 'done' },
        { id: 'queue', label: 'Na fila', state: 'done' },
        { id: 'worker', label: 'Worker processando', state: 'current' },
        { id: 'vectorized', label: vectorizedLabel, state: 'upcoming' },
      ]
    case 'COMPLETED':
      return [
        { id: 's3', label: 'Enviado ao S3', state: 'done' },
        { id: 'queue', label: 'Na fila', state: 'done' },
        { id: 'worker', label: 'Worker processando', state: 'done' },
        { id: 'vectorized', label: vectorizedLabel, state: 'done' },
      ]
    case 'FAILED':
      return [
        { id: 's3', label: 'Enviado ao S3', state: 'done' },
        { id: 'queue', label: 'Na fila', state: 'done' },
        { id: 'worker', label: 'Worker processando', state: 'failed' },
        { id: 'vectorized', label: vectorizedLabel, state: 'upcoming' },
      ]
  }
}
