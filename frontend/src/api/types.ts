export type DocumentStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface UserResponse {
  id: string
  email: string
  createdAt: string
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
}

export interface DocumentResponse {
  id: string
  fileName: string
  status: DocumentStatus
  chunkCount: number | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

export interface SourceReference {
  page: number | null
  chunkIndex: number | null
  excerpt: string
  score: number | null
}

export interface ChatAnswerResponse {
  answer: string
  sources: SourceReference[]
}

/** RFC 7807 como o Spring devolve, com as propriedades extras do backend. */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  instance?: string
  errors?: Record<string, string>
  documentStatus?: DocumentStatus
  [key: string]: unknown
}
