import type { ExternalSystem, Layer } from '../../flows/types'

export const LAYER_META: Record<Layer, { label: string; color: string }> = {
  seguranca: { label: 'Segurança', color: '#3A4F86' },
  web: { label: 'Web (Controller / Handler)', color: '#2F5F8F' },
  servico: { label: 'Serviço', color: '#4A6FA5' },
  'dominio-persistencia': { label: 'Domínio e persistência', color: '#6C84B8' },
  infra: { label: 'Infraestrutura', color: '#8A93A8' },
  externo: { label: 'Sistemas externos', color: '#B8B1A3' },
}

export const EXTERNAL_LABELS: Record<ExternalSystem, string> = {
  postgres: 'PostgreSQL / pgvector',
  s3: 'AWS S3',
  rabbitmq: 'RabbitMQ',
  openai: 'OpenAI',
}
