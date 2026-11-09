import { apiRequest } from './client'
import type { ChatAnswerResponse } from './types'

export const MAX_QUESTION_LENGTH = 2000

export function askQuestion(question: string, documentId: string): Promise<ChatAnswerResponse> {
  return apiRequest<ChatAnswerResponse>('/api/v1/chat', { method: 'POST', body: { question, documentId } })
}
