import { flowCatalog } from './catalog'

export const NO_VARIANT_WARNING = 'Status sem variante catalogada'

export interface ResolvedFlow {
  flowId: string
  variantId: string
  /** Preenchido quando nenhuma variante tem o status observado. */
  warning?: string
}

/** Remove origem, query e hash, deixando só o caminho. */
export function normalizePath(path: string): string {
  const withoutOrigin = path.replace(/^https?:\/\/[^/]+/i, '')
  const end = withoutOrigin.search(/[?#]/)
  return end >= 0 ? withoutOrigin.slice(0, end) : withoutOrigin
}

/**
 * Associa uma requisição observada ao fluxo catalogado e escolhe a variante pelo status.
 * Sem variante para o status, usa a de sucesso (a primeira) e devolve um aviso.
 */
export function resolveFlow(method: string, path: string, status: number): ResolvedFlow | null {
  const clean = normalizePath(path)
  const upper = method.toUpperCase()
  const flow = flowCatalog.find((f) => f.method === upper && f.pathPattern.test(clean))
  if (!flow) return null
  const variant = flow.variants.find((v) => v.status === status)
  if (variant) return { flowId: flow.id, variantId: variant.id }
  return { flowId: flow.id, variantId: flow.variants[0].id, warning: NO_VARIANT_WARNING }
}
