import { Send } from 'lucide-react'
import { useState } from 'react'
import { MAX_QUESTION_LENGTH } from '../../api/chat'
import type { DocumentResponse } from '../../api/types'
import { Button } from '../ui/Button'
import { disabledReasonFor } from './chatHelpers'

export function AskBox({
  document,
  busy,
  fieldError,
  onAsk,
}: {
  document: DocumentResponse | null
  busy: boolean
  fieldError?: string | null
  onAsk: (question: string) => Promise<void> | void
}) {
  const [question, setQuestion] = useState('')
  const disabledReason = disabledReasonFor(document)
  const disabled = Boolean(disabledReason) || busy
  const overLimit = question.length > MAX_QUESTION_LENGTH

  const submit = async () => {
    const trimmed = question.trim()
    if (!trimmed || disabled || overLimit) return
    setQuestion('')
    await onAsk(trimmed)
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
      className="flex flex-col gap-2 border-t border-slate-800/80 bg-slate-900/60 p-3.5"
    >
      {disabledReason && <p className="text-xs text-slate-400">{disabledReason}</p>}
      <div className="flex items-center gap-2.5">
        <div className="flex-1">
          <label htmlFor="chat-question-input" className="sr-only">
            Pergunta sobre o documento
          </label>
          <textarea
            id="chat-question-input"
            rows={2}
            value={question}
            disabled={disabled}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void submit()
              }
            }}
            placeholder={
              disabledReason
                ? 'Escolha um documento vetorizado para perguntar…'
                : 'Faça uma pergunta sobre o regulamento (Enter envia, Shift+Enter quebra a linha)…'
            }
            className="block w-full resize-none rounded-lg border border-slate-700/80 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 disabled:opacity-50 transition-colors"
          />
        </div>
        <Button type="submit" variant="primary" disabled={disabled || !question.trim() || overLimit}>
          <Send className="h-3.5 w-3.5" />
          <span>{busy ? 'Consultando…' : 'Perguntar'}</span>
        </Button>
      </div>
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>Enter envia, Shift+Enter quebra a linha</span>
        <span className={overLimit ? 'font-semibold text-red-400' : ''}>
          {question.length}/{MAX_QUESTION_LENGTH}
        </span>
      </div>
      {fieldError && (
        <p role="alert" className="text-xs text-red-400">
          {fieldError}
        </p>
      )}
    </form>
  )
}
