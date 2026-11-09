import { apiRequest } from './client'
import type { TokenResponse } from './types'

export interface Credentials {
  email: string
  password: string
}

export function login(credentials: Credentials): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/api/v1/auth/login', { method: 'POST', body: credentials, auth: false })
}

export function logout(refreshToken: string): Promise<void> {
  return apiRequest<void>('/api/v1/auth/logout', { method: 'POST', body: { refreshToken }, auth: false })
}
