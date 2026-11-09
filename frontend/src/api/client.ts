import { requireApiUrl } from '../config'
import { useInspector } from '../stores/inspector'
import { useSession } from '../stores/session'
import { maskBody, maskHeaders } from './mask'
import { ApiError, networkErrorMessage, parseProblem } from './problem'
import type { TokenResponse } from './types'

export const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Entre novamente.'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Objeto serializado como JSON. */
  body?: unknown
  formData?: FormData
  /** Rota protegida: injeta o Bearer e tenta o refresh em caso de 401. Padrão: true. */
  auth?: boolean
  signal?: AbortSignal
}

interface RawResponse {
  status: number
  headers: Headers
  text: string
}

let onSessionExpired: () => void = () => {}

/** O roteador registra aqui a navegação para /entrar. */
export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler
}

const RELEVANT_RESPONSE_HEADERS = ['location', 'www-authenticate', 'content-type']

function pickResponseHeaders(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {}
  for (const name of RELEVANT_RESPONSE_HEADERS) {
    const value = headers.get(name)
    if (value) out[name] = value
  }
  return out
}

function describeFormData(formData: FormData): unknown {
  const out: Record<string, string> = {}
  formData.forEach((value, key) => {
    out[key] = value instanceof File ? `(arquivo) ${value.name}, ${value.size} bytes` : String(value)
  })
  return out
}

/** Registra a chamada no inspetor, já com tudo mascarado. */
export function recordCall(entry: {
  method: string
  path: string
  status: number
  durationMs: number
  requestHeaders: Record<string, string>
  requestBody: unknown
  responseHeaders: Record<string, string>
  responseText: string
}) {
  useInspector.getState().add({
    method: entry.method,
    path: entry.path,
    status: entry.status,
    durationMs: entry.durationMs,
    at: Date.now(),
    requestHeaders: maskHeaders(entry.requestHeaders),
    requestBody: maskBody(entry.requestBody),
    responseHeaders: entry.responseHeaders,
    responseBody: maskBody(entry.responseText),
  })
}

async function sendOnce(path: string, options: RequestOptions, token: string | null): Promise<RawResponse> {
  const apiUrl = requireApiUrl()
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  let body: BodyInit | undefined
  let loggedBody: unknown

  if (options.formData) {
    body = options.formData // o navegador define o Content-Type com o boundary
    loggedBody = describeFormData(options.formData)
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
    loggedBody = options.body
  }
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`

  const started = performance.now()
  try {
    const response = await fetch(`${apiUrl}${path}`, { method, headers, body, signal: options.signal })
    const text = await response.text()
    recordCall({
      method,
      path,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      requestHeaders: headers,
      requestBody: loggedBody,
      responseHeaders: pickResponseHeaders(response.headers),
      responseText: text,
    })
    return { status: response.status, headers: response.headers, text }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    const message = networkErrorMessage(apiUrl)
    recordCall({
      method,
      path,
      status: 0,
      durationMs: Math.round(performance.now() - started),
      requestHeaders: headers,
      requestBody: loggedBody,
      responseHeaders: {},
      responseText: JSON.stringify({ detail: message }),
    })
    throw new ApiError(message, 0)
  }
}

// ---------------------------------------------------------------------------------------------
// Refresh com single-flight
//
// O backend ROTACIONA o refresh token a cada /auth/refresh e DETECTA REUSO: se um token já
// revogado chegar de novo, ele assume que foi roubado e revoga TODAS as sessões do usuário.
// Se três requisições recebessem 401 ao mesmo tempo e cada uma chamasse /auth/refresh com o
// mesmo token, a segunda e a terceira seriam tratadas como reuso e o usuário seria deslogado.
// Por isso existe uma única Promise compartilhada: quem chega depois espera a mesma resposta.
// ---------------------------------------------------------------------------------------------
let refreshInFlight: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const session = useSession.getState()
    const refreshToken = session.refreshToken
    if (!refreshToken) throw new ApiError(SESSION_EXPIRED_MESSAGE, 401)
    try {
      const response = await sendOnce('/api/v1/auth/refresh', { method: 'POST', body: { refreshToken }, auth: false }, null)
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError(SESSION_EXPIRED_MESSAGE, response.status, parseProblem(response.text))
      }
      const tokens = JSON.parse(response.text) as TokenResponse
      useSession.getState().setTokens(tokens.accessToken, tokens.refreshToken)
      return tokens.accessToken
    } catch (error) {
      useSession.getState().clear(SESSION_EXPIRED_MESSAGE)
      onSessionExpired()
      throw error
    }
  })().finally(() => {
    refreshInFlight = null
  })

  return refreshInFlight
}

function toApiError(response: RawResponse): ApiError {
  const problem = parseProblem(response.text)
  const message = problem?.detail || problem?.title || `Erro ${response.status} ao chamar a API.`
  return new ApiError(message, response.status, problem)
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const protectedRoute = options.auth !== false
  let token = useSession.getState().accessToken

  // Sem access token em memória (ex.: removido), renova antes de enviar.
  if (protectedRoute && !token && useSession.getState().refreshToken) {
    token = await refreshAccessToken()
  }

  let response = await sendOnce(path, options, token)

  if (protectedRoute && response.status === 401) {
    const current = useSession.getState().accessToken
    // Se outro 401 já provocou a renovação, basta repetir com o token novo.
    const fresh = current && current !== token ? current : await refreshAccessToken()
    response = await sendOnce(path, options, fresh) // repetida UMA vez
  }

  if (response.status < 200 || response.status >= 300) throw toApiError(response)
  if (response.status === 204 || !response.text) return undefined as T
  return JSON.parse(response.text) as T
}
