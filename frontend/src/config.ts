/** Configuração lida das variáveis de ambiente do Vite. Lida a cada chamada para facilitar os testes. */
export function getApiUrl(): string | undefined {
  const raw = import.meta.env.VITE_API_URL as string | undefined
  const trimmed = raw?.trim().replace(/\/+$/, '')
  return trimmed ? trimmed : undefined
}

export function requireApiUrl(): string {
  const url = getApiUrl()
  if (!url) throw new Error('VITE_API_URL não está definida.')
  return url
}

/** Link opcional para o painel do RabbitMQ. O frontend nunca faz requisições para este endereço. */
export function getRabbitUiUrl(): string | undefined {
  const raw = import.meta.env.VITE_RABBITMQ_UI_URL as string | undefined
  const trimmed = raw?.trim()
  return trimmed ? trimmed : undefined
}
