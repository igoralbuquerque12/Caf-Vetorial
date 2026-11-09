import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useInspector } from '../stores/inspector'
import { useSession } from '../stores/session'
import { apiRequest, SESSION_EXPIRED_MESSAGE, setSessionExpiredHandler } from './client'
import { ApiError } from './problem'

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function authHeader(init: RequestInit | undefined): string | null {
  return new Headers(init?.headers).get('Authorization')
}

describe('client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', 'http://api.test')
    useInspector.getState().clear()
    useSession.setState({ accessToken: 'old-access-token', refreshToken: 'refresh-1', user: null, phase: 'authenticated', notice: null })
    setSessionExpiredHandler(() => {})
  })

  it('três requisições simultâneas com 401 geram exatamente um refresh e cada uma é repetida uma vez', async () => {
    const calls: Record<string, number> = { refresh: 0, '/api/v1/documents': 0, '/api/v1/users/me': 0, '/api/v1/documents/1': 0 }
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input).replace('http://api.test', '')
      if (url === '/api/v1/auth/refresh') {
        calls.refresh += 1
        await new Promise((r) => setTimeout(r, 20)) // dá tempo de as outras pedirem
        return json(200, { accessToken: 'new-access-token', refreshToken: 'refresh-2', tokenType: 'Bearer', expiresIn: 900 })
      }
      calls[url] = (calls[url] ?? 0) + 1
      return authHeader(init) === 'Bearer new-access-token' ? json(200, { ok: url }) : json(401, { status: 401, detail: 'expirado' })
    })
    vi.stubGlobal('fetch', fetchMock)

    const results = await Promise.all([
      apiRequest('/api/v1/documents'),
      apiRequest('/api/v1/users/me'),
      apiRequest('/api/v1/documents/1'),
    ])

    expect(results).toHaveLength(3)
    expect(calls.refresh).toBe(1)
    // 1 tentativa com o token velho + 1 repetição com o novo, para cada requisição
    expect(calls['/api/v1/documents']).toBe(2)
    expect(calls['/api/v1/users/me']).toBe(2)
    expect(calls['/api/v1/documents/1']).toBe(2)
    expect(useSession.getState().accessToken).toBe('new-access-token')
    expect(useSession.getState().refreshToken).toBe('refresh-2')
  })

  it('falha no refresh limpa a sessão, avisa e rejeita a requisição', async () => {
    const expired = vi.fn()
    setSessionExpiredHandler(expired)
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).endsWith('/auth/refresh') ? json(401, { status: 401, detail: 'Refresh token inválido' }) : json(401, { status: 401 }),
      ),
    )

    await expect(apiRequest('/api/v1/documents')).rejects.toBeInstanceOf(ApiError)

    const session = useSession.getState()
    expect(session.accessToken).toBeNull()
    expect(session.refreshToken).toBeNull()
    expect(session.phase).toBe('anonymous')
    expect(session.notice).toBe(SESSION_EXPIRED_MESSAGE)
    expect(expired).toHaveBeenCalledTimes(1)
  })

  it('falha de rede vira ApiError com status 0 e a mensagem correta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))

    const error = await apiRequest('/api/v1/users', { method: 'POST', body: { email: 'a@b.com', password: 'x' }, auth: false }).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(0)
    expect((error as ApiError).message).toBe('Não foi possível falar com a API em http://api.test. Confira se o backend está rodando.')
  })

  it('registra no inspetor com senha e tokens mascarados', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(200, { accessToken: 'abcdefghijklmnopqrstuvwxyz', refreshToken: 'zyxwvutsrqponmlkjihgfedcba', tokenType: 'Bearer', expiresIn: 900 })))

    await apiRequest('/api/v1/auth/login', { method: 'POST', body: { email: 'a@b.com', password: 'segredo123' }, auth: false })

    const [record] = useInspector.getState().records
    expect(record.requestBody).toEqual({ email: 'a@b.com', password: '••••••••' })
    expect(record.responseBody).toMatchObject({ accessToken: 'abcdefghijkl…', refreshToken: 'zyxwvutsrqpo…' })
    expect(record.flowId).toBe('auth.login')
    expect(record.variantId).toBe('ok')
  })

  it('envia o Bearer nas rotas protegidas, mas o inspetor guarda só os 12 primeiros caracteres', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(authHeader(init)).toBe('Bearer old-access-token')
      return json(200, {})
    })
    vi.stubGlobal('fetch', fetchMock)
    await apiRequest('/api/v1/users/me')
    const record = useInspector.getState().records[0]
    expect(record.requestHeaders.Authorization).toBe('Bearer old-access-t…')
  })

  it('não envia Authorization nas rotas públicas', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, init?: RequestInit) => {
      expect(authHeader(init)).toBeNull()
      return json(200, {})
    })
    vi.stubGlobal('fetch', fetchMock)
    await apiRequest('/api/v1/auth/login', { method: 'POST', body: {}, auth: false })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('converte erros em ApiError com problem e fieldErrors', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json(400, { status: 400, detail: 'Dados inválidos', errors: { email: 'O e-mail deve ser válido' } })))
    const error = (await apiRequest('/api/v1/users', { method: 'POST', body: {}, auth: false }).catch((e: unknown) => e)) as ApiError
    expect(error.status).toBe(400)
    expect(error.fieldErrors).toEqual({ email: 'O e-mail deve ser válido' })
    expect(error.message).toBe('Dados inválidos')
  })
})
