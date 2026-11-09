import { recordCall, refreshAccessToken } from './client'
import { requireApiUrl } from '../config'
import { useSession } from '../stores/session'
import { ApiError, networkErrorMessage, parseProblem } from './problem'
import type { DocumentResponse } from './types'
import { apiRequest } from './client'

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024

export function listDocuments(): Promise<DocumentResponse[]> {
  return apiRequest<DocumentResponse[]>('/api/v1/documents')
}

export function getDocument(id: string): Promise<DocumentResponse> {
  return apiRequest<DocumentResponse>(`/api/v1/documents/${encodeURIComponent(id)}`)
}

export interface UploadResult {
  document: DocumentResponse
  /** Valor do header Location (exposto pelo CORS do backend). */
  location: string | null
}

interface XhrResult {
  status: number
  text: string
  location: string | null
}

function sendUpload(file: File, token: string | null, onProgress?: (fraction: number) => void): Promise<XhrResult> {
  const apiUrl = requireApiUrl()
  const path = '/api/v1/documents'
  return new Promise<XhrResult>((resolve, reject) => {
    // XMLHttpRequest porque o fetch não informa o progresso do envio.
    const xhr = new XMLHttpRequest()
    const started = performance.now()
    const formData = new FormData()
    formData.append('file', file)
    const requestHeaders: Record<string, string> = { Accept: 'application/json' }
    xhr.open('POST', `${apiUrl}${path}`)
    xhr.setRequestHeader('Accept', 'application/json')
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      requestHeaders.Authorization = `Bearer ${token}`
    }
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total)
    }
    const log = (status: number, text: string, responseHeaders: Record<string, string>) =>
      recordCall({
        method: 'POST',
        path,
        status,
        durationMs: Math.round(performance.now() - started),
        requestHeaders,
        requestBody: { file: `(arquivo) ${file.name}, ${file.size} bytes` },
        responseHeaders,
        responseText: text,
      })
    xhr.onload = () => {
      const location = xhr.getResponseHeader('Location')
      const wwwAuth = xhr.getResponseHeader('WWW-Authenticate')
      const responseHeaders: Record<string, string> = {}
      if (location) responseHeaders.location = location
      if (wwwAuth) responseHeaders['www-authenticate'] = wwwAuth
      log(xhr.status, xhr.responseText, responseHeaders)
      resolve({ status: xhr.status, text: xhr.responseText, location })
    }
    xhr.onerror = () => {
      const message = networkErrorMessage(apiUrl)
      log(0, JSON.stringify({ detail: message }), {})
      reject(new ApiError(message, 0))
    }
    xhr.send(formData)
  })
}

export async function uploadDocument(file: File, onProgress?: (fraction: number) => void): Promise<UploadResult> {
  let token = useSession.getState().accessToken
  if (!token && useSession.getState().refreshToken) token = await refreshAccessToken()

  let result = await sendUpload(file, token, onProgress)
  if (result.status === 401) {
    const current = useSession.getState().accessToken
    const fresh = current && current !== token ? current : await refreshAccessToken()
    result = await sendUpload(file, fresh, onProgress)
  }

  if (result.status < 200 || result.status >= 300) {
    const problem = parseProblem(result.text)
    throw new ApiError(problem?.detail || problem?.title || `Erro ${result.status} ao enviar o PDF.`, result.status, problem)
  }
  return { document: JSON.parse(result.text) as DocumentResponse, location: result.location }
}
