import type { DocumentStatus, ProblemDetail } from './types'

export class ApiError extends Error {
  readonly status: number
  readonly problem: ProblemDetail | null
  readonly fieldErrors: Record<string, string>

  constructor(message: string, status: number, problem: ProblemDetail | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.problem = problem
    this.fieldErrors = fieldErrorsOf(problem)
  }

  /** Propriedade `documentStatus` do 409 de documento não pronto. */
  get documentStatus(): DocumentStatus | undefined {
    return documentStatusOf(this.problem)
  }
}

export function isProblemDetail(value: unknown): value is ProblemDetail {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Converte o corpo de uma resposta de erro em ProblemDetail (ou null se não for JSON de objeto). */
export function parseProblem(text: string): ProblemDetail | null {
  if (!text) return null
  try {
    const parsed: unknown = JSON.parse(text)
    return isProblemDetail(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function fieldErrorsOf(problem: ProblemDetail | null): Record<string, string> {
  const errors = problem?.errors
  if (!errors || typeof errors !== 'object') return {}
  const result: Record<string, string> = {}
  for (const [field, message] of Object.entries(errors)) {
    if (typeof message === 'string') result[field] = message
  }
  return result
}

export function documentStatusOf(problem: ProblemDetail | null): DocumentStatus | undefined {
  const value = problem?.documentStatus
  return value === 'PENDING' || value === 'PROCESSING' || value === 'COMPLETED' || value === 'FAILED'
    ? value
    : undefined
}

export function networkErrorMessage(apiUrl: string): string {
  return `Não foi possível falar com a API em ${apiUrl}. Confira se o backend está rodando.`
}

/** Mensagem para o usuário: o `detail` do ProblemDetail quando existir. */
export function messageOf(error: unknown, fallback = 'Não foi possível concluir a ação. Tente novamente.'): string {
  if (error instanceof ApiError) return error.problem?.detail || error.message || fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}
