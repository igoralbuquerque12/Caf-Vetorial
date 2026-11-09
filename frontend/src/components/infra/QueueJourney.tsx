import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import type { DocumentResponse, DocumentStatus } from '../../api/types'
import { getRabbitUiUrl } from '../../config'
import * as msg from '../../content/snippets/messaging'
import { CodeTabs, type CodeTab } from '../code/CodeTabs'
import { StatusBadge } from '../ui/StatusBadge'
import { documentStatusLabel } from '../ui/statusHelpers'
import { Tabs } from '../ui/Tabs'
import { QueueTopology } from './QueueTopology'

const JOURNEY_COPY: Record<
  DocumentStatus,
  {
    headline: string
    detail: string
    stage: 'queued' | 'consuming' | 'acked' | 'failed'
  }
> = {
  PENDING: {
    headline: 'A mensagem está esperando na fila document.process.queue',
    detail:
      'O commit da transação já aconteceu e o DocumentUploadedEventListener publicou {"documentId": "..."} na exchange. A mensagem aguarda um consumidor livre.',
    stage: 'queued',
  },
  PROCESSING: {
    headline: 'A mensagem foi entregue ao consumidor e aguarda o ack',
    detail:
      'Com prefetch = 1, o RabbitMQ entregou esta mensagem ao @RabbitListener e marcou-a como unacked até que o método onMessage retorne.',
    stage: 'consuming',
  },
  COMPLETED: {
    headline: 'O ack foi enviado e a mensagem foi removida da fila',
    detail:
      'A ingestão terminou sem exceção. No modo acknowledge-mode: auto, o retorno normal do método confirma (ack) a entrega e o broker descarta a mensagem.',
    stage: 'acked',
  },
  FAILED: {
    headline: 'Processamento encerrado com falha',
    detail:
      'A mensagem foi confirmada (erro permanente, como um PDF sem texto) ou desviada para a DLQ (erro inesperado), conforme o tipo de falha.',
    stage: 'failed',
  },
}

const DEMO_STATUS_TABS = [
  { id: 'PENDING' as const, label: 'PENDING (na fila)' },
  { id: 'PROCESSING' as const, label: 'PROCESSING (no worker)' },
  { id: 'COMPLETED' as const, label: 'COMPLETED (ack)' },
  { id: 'FAILED' as const, label: 'FAILED (ack ou DLQ)' },
]

const MESSAGING_TABS: CodeTab[] = [
  {
    id: 'converter',
    label: 'Conversor JSON',
    snippet: msg.jsonConverter,
    note: 'A mensagem trafega como JSON simples com o documentId, nunca serialização binária do Java.',
  },
  {
    id: 'topology',
    label: 'Declaração da topologia',
    snippet: msg.topology,
    note: 'O Spring AMQP declara exchanges, filas e bindings automaticamente ao conectar no broker.',
  },
  {
    id: 'after-commit',
    label: 'Listener AFTER_COMMIT',
    snippet: msg.afterCommitListener,
    note: 'Publicar só depois do commit evita a corrida em que o worker busca no banco um registro ainda não commitado.',
  },
  {
    id: 'publisher',
    label: 'Publisher',
    snippet: msg.publisher,
    note: 'Envia para a exchange; se o broker estiver indisponível, marca o documento como FAILED.',
  },
  {
    id: 'worker',
    label: 'Listener do worker',
    snippet: msg.workerListener,
    note: 'Diferencia erro permanente (UnprocessableDocumentException -> ack) de falha inesperada (AmqpRejectAndDontRequeueException -> DLQ).',
  },
  {
    id: 'yaml',
    label: 'Bloco listener: do application.yml',
    snippet: msg.listenerYaml,
    note: 'acknowledge-mode: auto, default-requeue-rejected: false e prefetch: 1.',
  },
]

export function QueueJourney({ latestDocument }: { latestDocument: DocumentResponse | null }) {
  const [demoStatus, setDemoStatus] = useState<DocumentStatus>('PROCESSING')
  const effectiveStatus: DocumentStatus = latestDocument ? latestDocument.status : demoStatus
  const info = JOURNEY_COPY[effectiveStatus]
  const rabbitUiUrl = getRabbitUiUrl()
  const badge = latestDocument ? documentStatusLabel(latestDocument.status, latestDocument.chunkCount) : null

  return (
    <section
      aria-label="Fila RabbitMQ"
      className="flex flex-col gap-6 rounded-xl border border-slate-800/90 bg-slate-900/70 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Fila e processamento assíncrono (RabbitMQ)</h2>
          <p className="prose-copilot mt-1 text-sm text-slate-400">
            O upload responde <code>202 Accepted</code> assim que o PDF está no S3 e o registro <code>PENDING</code> foi
            commitado. O trabalho pesado (baixar o PDF, quebrar em chunks e gerar embeddings) acontece fora da
            requisição HTTP.
          </p>
        </div>
        {rabbitUiUrl && (
          <a
            href={rabbitUiUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-white no-underline transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
            <span>Abrir painel do RabbitMQ</span>
          </a>
        )}
      </div>

      <QueueTopology />

      {/* Jornada da mensagem guiada pelo último documento enviado (ou modo demonstração) */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-medium text-slate-400">
              {latestDocument
                ? `Guiado pelo seu último documento: ${latestDocument.fileName}`
                : 'Modo demonstração (envie um PDF no Workspace para guiar pelo status real)'}
            </span>
            <h3 className="mt-0.5 text-base font-semibold text-white">{info.headline}</h3>
          </div>
          {badge ? (
            <StatusBadge label={badge.label} tone={badge.tone} />
          ) : (
            <Tabs
              ariaLabel="Status de demonstração da fila"
              items={DEMO_STATUS_TABS}
              value={demoStatus}
              onChange={setDemoStatus}
            />
          )}
        </div>

        {/* Trilho visual das 4 etapas da mensagem */}
        <div className="grid gap-2.5 sm:grid-cols-4">
          <div
            className={`rounded-lg border p-3 transition-colors ${
              info.stage === 'queued'
                ? 'border-cyan-400/60 bg-cyan-400/5'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <span className="text-xs font-medium text-slate-400">1. Na fila</span>
            <p className="mt-1 font-mono text-xs font-semibold text-white">document.process.queue</p>
            <p className="mt-1 text-xs text-slate-400">Mensagem JSON aguardando entrega.</p>
          </div>

          <div
            className={`rounded-lg border p-3 transition-colors ${
              info.stage === 'consuming'
                ? 'border-cyan-400/60 bg-cyan-400/5'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <span className="text-xs font-medium text-slate-400">2. No consumidor</span>
            <p className="mt-1 font-mono text-xs font-semibold text-white">@RabbitListener</p>
            <p className="mt-1 text-xs text-slate-400">Entregue (unacked) enquanto o PDF é vetorizado.</p>
          </div>

          <div
            className={`rounded-lg border p-3 transition-colors ${
              info.stage === 'acked'
                ? 'border-emerald-400/60 bg-emerald-400/5'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <span className="text-xs font-medium text-slate-400">3. Confirmada (ack)</span>
            <p className="mt-1 text-xs font-semibold text-emerald-400">Removida da fila</p>
            <p className="mt-1 text-xs text-slate-400">Sucesso ou erro permanente já tratado.</p>
          </div>

          <div
            className={`rounded-lg border p-3 transition-colors ${
              info.stage === 'failed'
                ? 'border-red-400/60 bg-red-400/5'
                : 'border-slate-800/80 bg-slate-900/60'
            }`}
          >
            <span className="text-xs font-medium text-slate-400">4. Falha (ack ou DLQ)</span>
            <p className="mt-1 font-mono text-xs font-semibold text-red-400">document.process.dlq</p>
            <p className="mt-1 text-xs text-slate-400">Erro permanente: ack. Erro inesperado: vai para a DLQ.</p>
          </div>
        </div>

        <p className="prose-copilot text-sm text-slate-300">{info.detail}</p>
      </div>

      {/* Explicações curtas */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">At-least-once e idempotência</h3>
          <p className="prose-copilot mt-1.5 text-sm text-slate-400">
            O RabbitMQ garante entrega <em>pelo menos uma vez</em>: se a API cair antes do ack, a mensagem volta a ser
            entregue. Por isso o worker é <strong>idempotente</strong>: se o documento já está <code>COMPLETED</code>,{' '}
            <code>markProcessing</code> devolve vazio e ignora; se houve tentativa parcial,{' '}
            <code>vectorStore.delete(byDocumentId)</code> limpa os vetores antigos antes de inserir os novos.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">ack, prefetch, default-requeue-rejected e DLQ</h3>
          <p className="prose-copilot mt-1.5 text-sm text-slate-400">
            Com <code>prefetch: 1</code>, cada thread do worker pega um PDF por vez. Com{' '}
            <code>default-requeue-rejected: false</code>, lançar <code>AmqpRejectAndDontRequeueException</code> não
            devolve a mensagem para a fila principal (o que causaria loop infinito): o broker a encaminha para a{' '}
            <code>document.dlx</code> e ela aterrissa na <code>document.process.dlq</code>.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">Por que publicar só depois do commit</h3>
          <p className="prose-copilot mt-1.5 text-sm text-slate-400">
            Se o <code>convertAndSend</code> rodasse dentro da transação, o consumidor poderia receber a mensagem no
            mesmo milissegundo, consultar o Postgres antes do commit terminar e não encontrar o documento. O{' '}
            <code>@TransactionalEventListener(phase = AFTER_COMMIT)</code> garante que a publicação só ocorre com a
            linha já visível no banco.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h3 className="text-sm font-semibold text-white">Comparação com BullMQ e Kafka</h3>
          <p className="prose-copilot mt-1.5 text-sm text-slate-400">
            No <strong>BullMQ</strong> (Redis), a fila e o job state moram no mesmo lugar; no RabbitMQ, o roteamento é
            separado em <em>Exchange</em> + <em>Binding</em> + <em>Queue</em>, e o estado de negócio fica no Postgres.
            Diferente do <strong>Kafka</strong> (log imutável por partição retido por dias), o RabbitMQ é uma fila de
            trabalho: confirmou o ack, a mensagem sai da fila.
          </p>
        </div>
      </div>

      <CodeTabs tabs={MESSAGING_TABS} ariaLabel="Trechos de mensageria do backend" />
    </section>
  )
}
