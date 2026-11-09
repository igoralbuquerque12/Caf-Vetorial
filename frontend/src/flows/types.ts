export type Layer = 'seguranca' | 'web' | 'servico' | 'dominio-persistencia' | 'infra' | 'externo'
export type ExternalSystem = 'postgres' | 's3' | 'rabbitmq' | 'openai'

export interface Snippet {
  language: 'java' | 'yaml' | 'sql'
  /** Ilustrativo, até ~25 linhas, fiel ao comportamento do backend. */
  code: string
  /** Linhas destacadas (base 1, inclusive). */
  highlight?: [number, number]
}

export interface FlowStep {
  id: string
  className: string
  member?: string
  layer: Layer
  external?: ExternalSystem
  /** Trecho depois da fila (linha tracejada). */
  async?: boolean
  explanation: string
  nestEquivalent: string
  annotations?: string[]
  dependencies?: string[]
  snippet?: Snippet
  javaLessonId?: string
}

export interface FlowVariant {
  id: string
  label: string
  status: number
  stepIds: string[]
}

export interface FlowDefinition {
  id: string
  title: string
  method: 'GET' | 'POST'
  pathPattern: RegExp
  steps: FlowStep[]
  variants: FlowVariant[]
}
