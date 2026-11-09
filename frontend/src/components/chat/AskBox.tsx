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
      className="flex flex-col gap-2 border-t border-track bg-navy p-3.5"
    >
      {disabledReason && (
        <p className="text-xs text-cream-muted">{disabledReason}</p>
      )}
      <div className="flex items-end gap-2">
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
            className="w-full resize-none rounded-control border border-track bg-abyss px-3 py-2 text-base text-cream placeholder:text-cream-muted/60 disabled:opacity-50"
          />
        </div>
        {/* Único botão laranja da região do chat (seção 6.2). */}
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || !question.trim() || overLimit}
        >
          <Send className="h-4 w-4" />
          <span>{busy ? 'Consultando…' : 'Perguntar'}</span>
        </Button>
      </div>
      <div className="flex items-center justify-between text-xs text-cream-muted">
        <span>Enter envia, Shift+Enter quebra a linha</span>
        <span className={overLimit ? 'font-extrabold text-fail' : ''}>
          {question.length}/{MAX_QUESTION_LENGTH}
        </span>
      </div>
      {fieldError && (
        <p role="alert" className="text-xs text-fail">
          {fieldError}
        </p>
      )}
    </form>
  )
}
