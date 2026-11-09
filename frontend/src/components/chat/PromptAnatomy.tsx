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
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3.5 text-xs text-slate-100">
          <p className="font-semibold text-cyan-300">Reconstrução ilustrativa</p>
          <p className="prose-copilot mt-1 text-slate-300">
            O backend usa o prompt configurado no servidor (que pode ter sido personalizado via{' '}
            <code>APP_CHAT_SYSTEM_PROMPT</code>) e envia ao modelo o <strong>texto completo</strong> de cada chunk
            recuperado do <code>vector_store</code>. A API HTTP devolve nas fontes apenas os primeiros 240 caracteres de
            cada trecho, usados abaixo para ilustrar a montagem.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white">1. Mensagem de sistema (system prompt padrão)</h3>
          <p className="text-xs text-slate-400">
            Definido em <code>classpath:prompts/system-prompt.st</code> e validado no boot pelo{' '}
            <code>ChatPromptsLoader</code> (não pode conter chaves <code>{'{'}</code> ou <code>{'}'}</code>).
          </p>
          <pre className="m-0 overflow-x-auto rounded-xl border border-slate-800 bg-[#090f1e] p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {DEFAULT_SYSTEM_PROMPT}
          </pre>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white">2. Template de RAG com os marcadores substituídos</h3>
          <p className="text-xs text-slate-400">
            O <code>QuestionAnswerAdvisor</code> substitui <code>{'{query}'}</code> pela sua pergunta e{' '}
            <code>{'{question_answer_context}'}</code> pelos trechos retornados pelo <code>PgVectorStore</code>:
          </p>
          <pre className="m-0 overflow-x-auto rounded-xl border border-slate-800 bg-[#090f1e] p-3.5 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {renderedUserPrompt}
          </pre>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white">3. Template bruto no servidor</h3>
          <pre className="m-0 overflow-x-auto rounded-xl border border-slate-800 bg-[#090f1e] p-3.5 text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
            {DEFAULT_RAG_TEMPLATE}
          </pre>
        </section>
      </div>
    </Drawer>
  )
}
