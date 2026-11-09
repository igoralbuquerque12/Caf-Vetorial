import { beforeEach, describe, expect, it } from 'vitest'
import { countLabel, useInspector } from './inspector'

describe('inspector', () => {
  beforeEach(() => {
    useInspector.getState().clear()
  })

  it('agrupa requisições de polling idênticas e consecutivas num único registro com contador', () => {
    for (let i = 0; i < 12; i++) {
      useInspector.getState().add({
        method: 'GET',
        path: '/api/v1/documents/11111111-1111-4111-8111-111111111111',
        status: 200,
        durationMs: 14,
        at: Date.now(),
        requestHeaders: {},
        requestBody: undefined,
        responseHeaders: {},
        responseBody: { status: 'PROCESSING' },
      })
    }

    const records = useInspector.getState().records
    expect(records).toHaveLength(1)
    expect(records[0].count).toBe(12)
    expect(countLabel(records[0])).toBe('12 consultas de status')
  })

  it('mantém no máximo os últimos 150 registros', () => {
    for (let i = 0; i < 165; i++) {
      useInspector.getState().add({
        method: 'POST',
        path: '/api/v1/chat',
        status: 200,
        durationMs: i,
        at: Date.now(),
        requestHeaders: {},
        requestBody: { q: i },
        responseHeaders: {},
        responseBody: {},
      })
    }

    const records = useInspector.getState().records
    expect(records).toHaveLength(150)
    expect(records[0].durationMs).toBe(15)
    expect(records[149].durationMs).toBe(164)
  })
})
