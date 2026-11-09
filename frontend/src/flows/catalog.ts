import { chatAsk, documentGet, documentList, documentUpload } from './documentFlows'
import { authLogin, authLogout, authRefresh, userMe, userRegister } from './userFlows'
import type { FlowDefinition, FlowStep, FlowVariant } from './types'

export const flowCatalog: FlowDefinition[] = [
  userRegister,
  authLogin,
  authRefresh,
  authLogout,
  userMe,
  documentUpload,
  documentGet,
  documentList,
  chatAsk,
]

export function getFlow(id: string): FlowDefinition | undefined {
  return flowCatalog.find((f) => f.id === id)
}

export function getVariant(flow: FlowDefinition, variantId: string | null | undefined): FlowVariant {
  return flow.variants.find((v) => v.id === variantId) ?? flow.variants[0]
}

/** Passos de uma variante, na ordem. */
export function stepsOfVariant(flow: FlowDefinition, variant: FlowVariant): FlowStep[] {
  return variant.stepIds
    .map((id) => flow.steps.find((s) => s.id === id))
    .filter((s): s is FlowStep => Boolean(s))
}

/** Rótulo curto de um fluxo para listas: "POST /api/v1/chat". */
export function flowRoute(flow: FlowDefinition): string {
  const routes: Record<string, string> = {
    'user.register': '/api/v1/users',
    'auth.login': '/api/v1/auth/login',
    'auth.refresh': '/api/v1/auth/refresh',
    'auth.logout': '/api/v1/auth/logout',
    'user.me': '/api/v1/users/me',
    'document.upload': '/api/v1/documents',
    'document.get': '/api/v1/documents/{id}',
    'document.list': '/api/v1/documents',
    'chat.ask': '/api/v1/chat',
  }
  return `${flow.method} ${routes[flow.id] ?? ''}`.trim()
}
