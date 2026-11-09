import { Compass, FileCode } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { DocumentStatus, SourceReference } from '../../api/types'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { SourceList } from './SourceList'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  /** Pergunta que originou esta resposta, usada pelo PromptAnatomy. */
  question?: string
  sources?: SourceReference[]
  /** Registro no inspetor correspondente a esta mensagem. */
  inspectorRecordId?: string
  httpStatus?: number
  documentStatus?: DocumentStatus
}

export function MessageBubble({
  message,
  onOpenXRay,
  onOpenPrompt,
}: {
  message: ChatMessage
  onOpenXRay: (inspectorRecordId?: string) => void
  onOpenPrompt: (message: ChatMessage) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="self-end max-w-xl rounded-2xl rounded-tr-sm border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-slate-100">
        <p className="prose-copilot whitespace-pre-wrap text-sm">{message.text}</p>
      </div>
    )
  }

  if (message.role === 'system') {
    return (
      <div
        role="alert"
        className="flex flex-col gap-2.5 rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-slate-100"
      >
        <div className="flex flex-wrap items-center gap-2">
          {message.httpStatus != null && <StatusBadge label={`HTTP ${message.httpStatus}`} tone="fail" />}
          {message.documentStatus && <StatusBadge label={`documentStatus: ${message.documentStatus}`} tone="busy" />}
          <span className="font-semibold text-red-300">Não foi possível responder à pergunta</span>
        </div>
        <p className="prose-copilot text-slate-200">{message.text}</p>
        {message.inspectorRecordId && (
          <div>
            <Button variant="secondary" size="sm" onClick={() => onOpenXRay(message.inspectorRecordId)}>
              <Compass className="h-3.5 w-3.5" />
              <span>Ver o caminho desta resposta</span>
            </Button>
          </div>
        )}
      </div>
    )
  }

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-slate-800/90 bg-slate-900/70 p-4">
      <div className="prose-copilot text-sm text-slate-100">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
      </div>

      {message.sources && message.sources.length > 0 && <SourceList sources={message.sources} />}

      <div className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3">
        <Button variant="secondary" size="sm" onClick={() => onOpenXRay(message.inspectorRecordId)}>
          <Compass className="h-3.5 w-3.5 text-cyan-400" />
          <span>Ver o caminho desta resposta</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => onOpenPrompt(message)}>
          <FileCode className="h-3.5 w-3.5 text-cyan-400" />
          <span>Ver o prompt montado</span>
        </Button>
      </div>
    </article>
  )
}
