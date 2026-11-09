import * as chat from '../../content/snippets/chat'
import { DEFAULT_RAG_TEMPLATE, DEFAULT_SYSTEM_PROMPT } from '../../content/prompts'
import { CodeBlock } from '../code/CodeBlock'

export function PromptsSection() {
  return (
    <section
      aria-label="Prompts e validação no boot"
      className="flex flex-col gap-6 rounded-xl border border-slate-800/90 bg-slate-900/70 p-5"
    >
      <div>
        <h2 className="text-lg font-semibold text-white">Prompts padrão e validação no boot</h2>
        <p className="prose-copilot mt-1 text-sm text-slate-400">
          Os prompts ficam em arquivos <code>.st</code> no classpath e são lidos e validados na inicialização pelo{' '}
          <code>ChatPromptsLoader</code>. Se um arquivo personalizado tiver erro, a aplicação falha no boot em vez de
          quebrar só quando um usuário fizer uma pergunta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">System prompt padrão</h3>
            <span className="font-mono text-xs text-slate-400">prompts/system-prompt.st</span>
          </div>
          <p className="text-xs text-slate-400">
            Regra validada no boot: não pode estar vazio nem conter <code>{'{'}</code> ou <code>{'}'}</code>, que o
            Spring AI interpretaria como variáveis de template.
          </p>
          <pre className="m-0 overflow-x-auto rounded-lg border border-slate-800 bg-[#090f1e] p-3 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {DEFAULT_SYSTEM_PROMPT}
          </pre>
        </div>

        <div className="flex flex-col gap-2 rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">Template de RAG com marcadores</h3>
            <span className="font-mono text-xs text-slate-400">prompts/rag-prompt.st</span>
          </div>
          <p className="text-xs text-slate-400">
            Marcadores obrigatórios validados no boot: <span className="font-mono font-semibold text-amber-300">{'{query}'}</span> e{' '}
            <span className="font-mono font-semibold text-amber-300">{'{question_answer_context}'}</span>.
          </p>
          <pre className="m-0 overflow-x-auto rounded-lg border border-slate-800 bg-[#090f1e] p-3 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {DEFAULT_RAG_TEMPLATE.split(/(\{query\}|\{question_answer_context\})/g).map((part, i) =>
              part === '{query}' || part === '{question_answer_context}' ? (
                <mark key={i} className="rounded bg-amber-400/15 px-1 text-amber-300 font-semibold">
                  {part}
                </mark>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </pre>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
        <h3 className="text-sm font-semibold text-white">Como personalizar sem recompilar (APP_CHAT_SYSTEM_PROMPT)</h3>
        <p className="prose-copilot mt-1.5 text-sm text-slate-400">
          O <code>ChatProperties</code> recebe cada prompt como um <code>org.springframework.core.io.Resource</code>.
          Por padrão ele aponta para <code>classpath:prompts/system-prompt.st</code>, mas você pode sobrescrever no
          servidor definindo <code>APP_CHAT_SYSTEM_PROMPT=file:./prompts/system-prompt.custom.st</code> e reiniciando a
          aplicação.
        </p>
      </div>

      <CodeBlock
        code={chat.chatRagTemplate.code}
        language="java"
        highlight={chat.chatRagTemplate.highlight}
        title="ChatPromptsLoader.validateRagPrompt"
      />
    </section>
  )
}
