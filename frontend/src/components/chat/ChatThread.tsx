import type { DocumentResponse } from '../../api/types'
import { SUGGESTED_QUESTIONS } from './chatHelpers'
import { MessageBubble, type ChatMessage } from './MessageBubble'

export function ChatThread({
  document,
  messages,
  busy,
  onSuggestion,
  onOpenXRay,
  onOpenPrompt,
}: {
  document: DocumentResponse | null
  messages: ChatMessage[]
  busy: boolean
  onSuggestion: (question: string) => void
  onOpenXRay: (inspectorRecordId?: string) => void
  onOpenPrompt: (message: ChatMessage) => void
}) {
  const canSuggest = document?.status === 'COMPLETED' && !busy

  return (
    <div
      aria-live="polite"
      className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
    >
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-4 rounded-panel border border-track bg-abyss/40 p-5">
          <div>
            <h3 className="text-lg">
              {document
                ? `Pergunte sobre ${document.fileName}`
                : 'Selecione um documento para iniciar a conversa'}
            </h3>
            <p className="prose-copilot mt-1 text-sm text-cream-muted">
              Cada resposta mostra os trechos recuperados do <code>pgvector</code> com página e similaridade, o prompt
              montado e o caminho completo pelas classes Java no Raio-X.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-cream-muted">Sugestões de pergunta:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!canSuggest}
                  onClick={() => onSuggestion(q)}
                  className="rounded-full border border-track bg-navy-raised px-3.5 py-1.5 text-left text-sm font-semibold text-cream hover:bg-track disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onOpenXRay={onOpenXRay}
            onOpenPrompt={onOpenPrompt}
          />
        ))
      )}

      {busy && (
        <div role="status" className="self-start rounded-panel border border-track bg-navy-raised px-4 py-3 text-sm text-busy">
          Buscando trechos no pgvector e consultando o modelo…
        </div>
      )}
    </div>
  )
}
