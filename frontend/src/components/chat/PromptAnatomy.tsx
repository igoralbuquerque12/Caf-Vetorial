import type { SourceReference } from '../../api/types'
import { DEFAULT_RAG_TEMPLATE, DEFAULT_SYSTEM_PROMPT, renderRagPrompt } from '../../content/prompts'
import { Drawer } from '../ui/Drawer'

export function PromptAnatomy({
  open,
  onClose,
  question,
  sources,
}: {
  open: boolean
  onClose: () => void
  question: string
  sources: SourceReference[]
}) {
  const renderedUserPrompt = renderRagPrompt(question, sources)

  return (
    <Drawer open={open} title="Anatomia do prompt enviado ao modelo" onClose={onClose}>
      <div className="flex flex-col gap-5">
        <div className="rounded-panel border border-busy/40 bg-busy/10 p-3.5 text-sm text-cream">
          <p className="font-extrabold">Reconstrução ilustrativa</p>
          <p className="prose-copilot mt-1 text-cream-muted">
            O backend usa o prompt configurado no servidor (que pode ter sido personalizado via{' '}
            <code>APP_CHAT_SYSTEM_PROMPT</code>) e envia ao modelo o <strong>texto completo</strong> de cada chunk
            recuperado do <code>vector_store</code>. A API HTTP devolve nas fontes apenas os primeiros 240 caracteres de
            cada trecho, usados abaixo para ilustrar a montagem.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-base">1. Mensagem de sistema (system prompt padrão)</h3>
          <p className="text-sm text-cream-muted">
            Definido em <code>classpath:prompts/system-prompt.st</code> e validado no boot pelo{' '}
            <code>ChatPromptsLoader</code> (não pode conter chaves <code>{'{'}</code> ou <code>{'}'}</code>).
          </p>
          <pre className="m-0 overflow-x-auto rounded-panel border border-track bg-abyss p-3.5 text-xs text-cream whitespace-pre-wrap">
            {DEFAULT_SYSTEM_PROMPT}
          </pre>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base">2. Template de RAG com os marcadores substituídos</h3>
          <p className="text-sm text-cream-muted">
            O <code>QuestionAnswerAdvisor</code> substitui <code>{'{query}'}</code> pela sua pergunta e{' '}
            <code>{'{question_answer_context}'}</code> pelos trechos retornados pelo <code>PgVectorStore</code>:
          </p>
          <pre className="m-0 overflow-x-auto rounded-panel border border-track bg-abyss p-3.5 text-xs text-cream whitespace-pre-wrap">
            {renderedUserPrompt}
          </pre>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-base">3. Template bruto no servidor</h3>
          <pre className="m-0 overflow-x-auto rounded-panel border border-track bg-abyss p-3.5 text-xs text-cream-muted whitespace-pre-wrap">
            {DEFAULT_RAG_TEMPLATE}
          </pre>
        </section>
      </div>
    </Drawer>
  )
}
