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
    <div aria-live="polite" className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-4 lg:p-5">
      {messages.length === 0 ? (
        <div className="my-auto flex flex-col justify-center gap-4 rounded-xl border border-slate-800/80 bg-slate-900/40 p-6">
          <div>
            <h3 className="text-base font-semibold text-white">
              {document ? `Pergunte sobre ${document.fileName}` : 'Selecione um documento para iniciar a conversa'}
            </h3>
            <p className="prose-copilot mt-1.5 text-sm text-slate-400">
              Cada resposta mostra os trechos recuperados do <code>pgvector</code> com página e similaridade, o prompt
              montado e o caminho completo pelas classes Java no Raio-X.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium text-slate-400">Sugestões de pergunta:</span>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  disabled={!canSuggest}
                  onClick={() => onSuggestion(q)}
                  className="rounded-full border border-slate-700/80 bg-slate-900/80 px-3.5 py-1.5 text-left text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:bg-slate-800 hover:text-white disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onOpenXRay={onOpenXRay} onOpenPrompt={onOpenPrompt} />
        ))
      )}

      {busy && (
        <div
          role="status"
          className="self-start rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2.5 text-xs text-cyan-300"
        >
          Buscando trechos no pgvector e consultando o modelo…
        </div>
      )}
    </div>
  )
}
