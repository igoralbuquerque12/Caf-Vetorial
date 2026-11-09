/**
 * Máscaras aplicadas a tudo o que vai para o inspetor.
 * - password: "••••••••"
 * - accessToken, refreshToken e o header Authorization: 12 primeiros caracteres + "…"
 */
export const PASSWORD_MASK = '••••••••'

export function maskToken(value: string): string {
  return `${value.slice(0, 12)}…`
}

export function maskAuthorization(value: string): string {
  const match = /^(Bearer)\s+(.+)$/i.exec(value)
  if (match) return `${match[1]} ${maskToken(match[2])}`
  return maskToken(value)
}

const TOKEN_KEYS = new Set(['accesstoken', 'refreshtoken'])

/** Copia profunda de um valor JSON, mascarando campos sensíveis. */
export function maskJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskJson)
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const lower = key.toLowerCase()
      if (lower === 'password') out[key] = PASSWORD_MASK
      else if (TOKEN_KEYS.has(lower) && typeof v === 'string') out[key] = maskToken(v)
      else out[key] = maskJson(v)
    }
    return out
  }
  return value
}

export function maskHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [name, value] of Object.entries(headers)) {
    out[name] = name.toLowerCase() === 'authorization' ? maskAuthorization(value) : value
  }
  return out
}

/** Mascara um corpo de texto (JSON ou outro). Texto que não é JSON passa por mascaramento por padrão. */
export function maskBody(body: unknown): unknown {
  if (typeof body === 'string') {
    try {
      return maskJson(JSON.parse(body))
    } catch {
      return body
    }
  }
  return maskJson(body)
}
