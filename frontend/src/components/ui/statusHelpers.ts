import type { DocumentStatus } from '../../api/types'

export type Tone = 'ok' | 'fail' | 'busy' | 'muted'

export function toneForHttpStatus(status: number): Tone {
  if (status >= 200 && status < 300) return 'ok'
  if (status >= 400 || status === 0) return 'fail'
  return 'muted'
}

export function documentStatusLabel(
  status: DocumentStatus,
  chunkCount?: number | null,
): { label: string; tone: Tone } {
  switch (status) {
    case 'PENDING':
      return { label: 'Na fila', tone: 'muted' }
    case 'PROCESSING':
      return { label: 'Processando', tone: 'busy' }
    case 'COMPLETED':
      return {
        label: chunkCount != null ? `Vetorizado (${chunkCount} trechos)` : 'Vetorizado',
        tone: 'ok',
      }
    case 'FAILED':
      return { label: 'Falhou', tone: 'fail' }
  }
}
