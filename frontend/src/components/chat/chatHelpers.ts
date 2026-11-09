import type { DocumentResponse } from '../../api/types'

/** Sugestões obrigatórias da seção 7. */
export const SUGGESTED_QUESTIONS = [
  'Como funciona a portabilidade?',
  'Existe carência para resgate?',
  'Qual é a taxa de carregamento?',
  'O que acontece com o saldo em caso de falecimento?',
] as const

export function disabledReasonFor(doc: DocumentResponse | null): string | null {
  if (!doc) {
    return 'Selecione ou envie um documento vetorizado na coluna ao lado para fazer perguntas.'
  }
  if (doc.status === 'PENDING' || doc.status === 'PROCESSING') {
    return `O documento "${doc.fileName}" ainda está sendo processado (${doc.status}). Aguarde chegar em "Vetorizado".`
  }
  if (doc.status === 'FAILED') {
    return `O processamento de "${doc.fileName}" falhou. Envie outro PDF ou escolha um documento vetorizado.`
  }
  return null
}
