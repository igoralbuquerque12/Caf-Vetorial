import type { ExternalSystem, Layer } from '../../flows/types'

export const LAYER_META: Record<Layer, { label: string; shortLabel: string; color: string }> = {
  seguranca: { label: 'Segurança', shortLabel: 'Segurança', color: '#38bdf8' },
  web: { label: 'Web (Controller / Handler)', shortLabel: 'Web / API', color: '#22d3ee' },
  servico: { label: 'Serviço', shortLabel: 'Serviço', color: '#60a5fa' },
  'dominio-persistencia': { label: 'Domínio e persistência', shortLabel: 'Persistência', color: '#818cf8' },
  infra: { label: 'Infraestrutura', shortLabel: 'Infraestrutura', color: '#94a3b8' },
  externo: { label: 'Sistemas externos', shortLabel: 'Externo', color: '#cbd5e1' },
}

export const EXTERNAL_LABELS: Record<ExternalSystem, string> = {
  postgres: 'PostgreSQL / pgvector',
  s3: 'AWS S3',
  rabbitmq: 'RabbitMQ',
  openai: 'OpenAI',
}
