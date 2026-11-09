import { Compass } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CodeBlock } from '../components/code/CodeBlock'
import { javaLessons } from '../content/javaLessons'
import { getFlow } from '../flows/catalog'

export function JavaForNest() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('aula') ?? javaLessons[0].id

  const lessonIndex = useMemo(() => {
    const idx = javaLessons.findIndex((l) => l.id === activeId)
    return idx >= 0 ? idx : 0
  }, [activeId])

  const lesson = javaLessons[lessonIndex]

  const selectLesson = (id: string) => {
    setSearchParams({ aula: id })
  }

  return (
    <main className="grid flex-1 lg:grid-cols-12">
      {/* Navegação lateral: seletor no mobile e lista numerada no desktop */}
      <aside
        aria-label="Lista de aulas de Java"
        className="flex flex-col gap-3 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-900/40 p-4 lg:col-span-4 xl:col-span-3"
      >
        <div>
          <h1 className="text-sm font-semibold text-white">Java para quem vem do Nest</h1>
          <p className="mt-0.5 text-xs text-slate-400">16 aulas comparando NestJS/TypeScript com Spring Boot</p>
        </div>

        <div className="lg:hidden">
          <label htmlFor="lesson-mobile-select" className="sr-only">
            Escolher aula
          </label>
          <select
            id="lesson-mobile-select"
            value={lesson.id}
            onChange={(e) => selectLesson(e.target.value)}
            className="w-full rounded-lg border border-slate-700/80 bg-slate-950 px-3 py-2 text-xs text-slate-200"
          >
            {javaLessons.map((item, idx) => (
              <option key={item.id} value={item.id}>
                {idx + 1}. {item.title}
              </option>
            ))}
          </select>
        </div>

        <ol className="hidden lg:flex m-0 flex-col divide-y divide-slate-800/80 overflow-hidden rounded-xl border border-slate-800/90 bg-slate-950/50 p-0 list-none">
          {javaLessons.map((item, idx) => {
            const selected = item.id === lesson.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectLesson(item.id)}
                  aria-pressed={selected}
                  className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left cursor-pointer transition-all border-l-2 ${
                    selected
                      ? 'border-l-cyan-400 bg-slate-800/60'
                      : 'border-l-transparent hover:bg-slate-900/70'
                  }`}
                >
                  <span className={`text-xs font-semibold ${selected ? 'text-cyan-400' : 'text-slate-100'}`}>
                    {idx + 1}. {item.title}
                  </span>
                  <span className="text-[11px] text-slate-400 leading-snug">{item.summary}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Conteúdo central da aula */}
      <article className="flex flex-col gap-6 bg-slate-950 p-4 md:p-6 lg:col-span-8 xl:col-span-9 min-w-0">
        <header className="rounded-xl border border-slate-800/90 bg-slate-900/70 p-5">
          <span className="inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
            Aula {lessonIndex + 1} de {javaLessons.length}
          </span>
          <h2 className="mt-2.5 text-xl font-semibold text-white">{lesson.title}</h2>
          <div className="prose-copilot mt-3 flex flex-col gap-3 text-sm text-slate-300">
            {lesson.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </header>

        {/* Painel lado a lado: No Nest/TypeScript e No backend do copilot */}
        <section aria-label="Comparação lado a lado" className="grid gap-4 xl:grid-cols-2">
          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-slate-200">No Nest/TypeScript</h3>
            <CodeBlock
              code={lesson.nest.code}
              language={lesson.nest.language}
              highlight={lesson.nest.highlight}
              title="No Nest/TypeScript"
              caption="Equivalente para comparação"
            />
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <h3 className="text-sm font-semibold text-slate-200">No backend do copilot</h3>
            <CodeBlock
              code={lesson.java.code}
              language={lesson.java.language}
              highlight={lesson.java.highlight}
              title="No backend do copilot"
            />
          </div>
        </section>

        {/* Onde aparece no fluxo */}
        <section
          aria-label="Onde aparece no fluxo"
          className="flex flex-col gap-3.5 rounded-xl border border-slate-800/90 bg-slate-900/70 p-5"
        >
          <div>
            <h3 className="text-base font-semibold text-white">Onde aparece no fluxo</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique numa estação para abrir o Raio-X exatamente no ponto em que este conceito entra em ação.
            </p>
          </div>

          <ul className="m-0 grid gap-3 md:grid-cols-2 p-0 list-none">
            {lesson.appearsIn.map((link) => {
              const flow = getFlow(link.flowId)
              const step = flow?.steps.find((s) => s.id === link.stepId)
              return (
                <li key={`${link.flowId}-${link.stepId}`}>
                  <Link
                    to={`/raio-x?flow=${encodeURIComponent(link.flowId)}&step=${encodeURIComponent(link.stepId)}`}
                    className="flex h-full flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-cyan-400/50 hover:bg-slate-900 no-underline transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-cyan-400">
                          {step ? `${step.className}${step.member ? `.${step.member}` : ''}` : link.stepId}
                        </span>
                        <Compass className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                      </div>
                      <span className="mt-1 block text-xs font-medium text-slate-200">
                        Fluxo: {flow?.title ?? link.flowId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{link.note}</p>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      </article>
    </main>
  )
}
