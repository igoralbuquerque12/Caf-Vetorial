import { create } from 'zustand'
import { resolveFlow } from '../flows/resolveFlow'

export const MAX_RECORDS = 150

export interface InspectorRecord {
  id: string
  method: string
  /** Rota com query, sem a origem. */
  path: string
  status: number
  durationMs: number
  /** Epoch em ms do fim da chamada. */
  at: number
  /** Já mascarados. */
  requestHeaders: Record<string, string>
  requestBody: unknown
  responseHeaders: Record<string, string>
  responseBody: unknown
  flowId: string | null
  variantId: string | null
  /** Ex.: "Status sem variante catalogada". */
  warning: string | null
  /** Quantas chamadas idênticas e consecutivas este registro representa. */
  count: number
}

export type NewInspectorRecord = Omit<InspectorRecord, 'id' | 'flowId' | 'variantId' | 'warning' | 'count'>

interface InspectorState {
  records: InspectorRecord[]
  selectedId: string | null
  /** Último registro de chat, para "Ver o caminho desta resposta". */
  add: (record: NewInspectorRecord) => InspectorRecord
  select: (id: string | null) => void
  clear: () => void
}

let sequence = 0

export function isSameCall(previous: InspectorRecord, next: NewInspectorRecord): boolean {
  return previous.method === next.method && previous.path === next.path && previous.status === next.status && next.method === 'GET'
}

export const useInspector = create<InspectorState>((set, get) => ({
  records: [],
  selectedId: null,
  add: (input) => {
    const resolved = resolveFlow(input.method, input.path, input.status)
    const current = get().records
    const last = current[current.length - 1]

    // Polling idêntico e consecutivo vira um único registro com contador.
    if (last && isSameCall(last, input)) {
      const merged: InspectorRecord = {
        ...last,
        durationMs: input.durationMs,
        at: input.at,
        responseHeaders: input.responseHeaders,
        responseBody: input.responseBody,
        count: last.count + 1,
      }
      set({ records: [...current.slice(0, -1), merged] })
      return merged
    }

    sequence += 1
    const record: InspectorRecord = {
      ...input,
      id: `call-${Date.now().toString(36)}-${sequence}`,
      flowId: resolved?.flowId ?? null,
      variantId: resolved?.variantId ?? null,
      warning: resolved?.warning ?? null,
      count: 1,
    }
    const next = [...current, record]
    set({ records: next.length > MAX_RECORDS ? next.slice(next.length - MAX_RECORDS) : next })
    return record
  },
  select: (id) => set({ selectedId: id }),
  clear: () => set({ records: [], selectedId: null }),
}))

/** Texto do contador, ex.: "12 consultas de status". */
export function countLabel(record: InspectorRecord): string | null {
  if (record.count <= 1) return null
  const isDocument = /\/documents\/[^/]+$/.test(record.path)
  return isDocument ? `${record.count} consultas de status` : `${record.count} chamadas idênticas`
}
