import { apiRequest } from './client'
import type { Credentials } from './auth'
import type { UserResponse } from './types'

export function createUser(credentials: Credentials): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/v1/users', { method: 'POST', body: credentials, auth: false })
}

export function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/v1/users/me')
}
