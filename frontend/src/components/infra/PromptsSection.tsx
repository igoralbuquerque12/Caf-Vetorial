import * as chat from '../../content/snippets/chat'
import { DEFAULT_RAG_TEMPLATE, DEFAULT_SYSTEM_PROMPT } from '../../content/prompts'
import { CodeBlock } from '../code/CodeBlock'

export function PromptsSection() {
  return (
    <section aria-label="Prompts e validação no boot" className="flex flex-col gap-6 rounded-panel border border-track bg-navy p-5">
      <div>
        <h2 className="text-xl">Prompts padrão e validação no boot</h2>
        <p className="prose-copilot mt-1 text-sm text-cream-muted">
          Os prompts ficam em arquivos <code>.st</code> no classpath e são lidos e validados na inicialização pelo{' '}
          <code>ChatPromptsLoader</code>. Se um arquivo personalizado tiver erro, a aplicação falha no boot em vez de
          quebrar só quando um usuário fizer uma pergunta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-panel border border-track bg-abyss p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base">System prompt padrão</h3>
            <span className="text-xs text-cream-muted">prompts/system-prompt.st</span>
          </div>
          <p className="text-xs text-cream-muted">
            Regra validada no boot: não pode estar vazio nem conter <code>{'{'}</code> ou <code>{'}'}</code>, que o
            Spring AI interpretaria como variáveis de template.
          </p>
          <pre className="m-0 overflow-x-auto rounded-control border border-track bg-navy p-3 text-xs text-cream whitespace-pre-wrap">
            {DEFAULT_SYSTEM_PROMPT}
          </pre>
        </div>

        <div className="flex flex-col gap-2 rounded-panel border border-track bg-abyss p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base">Template de RAG com marcadores</h3>
            <span className="text-xs text-cream-muted">prompts/rag-prompt.st</span>
          </div>
          <p className="text-xs text-cream-muted">
            Marcadores obrigatórios validados no boot: <span className="font-semibold text-sand">{'{query}'}</span> e{' '}
            <span className="font-semibold text-sand">{'{question_answer_context}'}</span>.
          </p>
          <pre className="m-0 overflow-x-auto rounded-control border border-track bg-navy p-3 text-xs text-cream whitespace-pre-wrap">
            {DEFAULT_RAG_TEMPLATE.split(/(\{query\}|\{question_answer_context\})/g).map((part, i) =>
              part === '{query}' || part === '{question_answer_context}' ? (
                <mark key={i} className="rounded bg-navy-raised px-1 text-sand font-extrabold">
                  {part}
                </mark>
              ) : (
                <span key={i}>{part}</span>
              ),
            )}
          </pre>
        </div>
      </div>

      <div className="rounded-panel border border-track bg-abyss p-4">
        <h3 className="text-base">Como personalizar sem recompilar (APP_CHAT_SYSTEM_PROMPT)</h3>
        <p className="prose-copilot mt-1.5 text-sm text-cream-muted">
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
