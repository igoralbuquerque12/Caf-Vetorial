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
        className="flex flex-col gap-3 border-b lg:border-b-0 lg:border-r border-track bg-navy p-4 lg:col-span-4 xl:col-span-3"
      >
        <div>
          <h1 className="text-lg">Java para quem vem do Nest</h1>
          <p className="mt-0.5 text-xs text-cream-muted">16 aulas comparando NestJS/TypeScript com Spring Boot</p>
        </div>

        <div className="lg:hidden">
          <label htmlFor="lesson-mobile-select" className="sr-only">
            Escolher aula
          </label>
          <select
            id="lesson-mobile-select"
            value={lesson.id}
            onChange={(e) => selectLesson(e.target.value)}
            className="w-full rounded-control border border-track bg-abyss px-3 py-2 text-sm text-cream"
          >
            {javaLessons.map((item, idx) => (
              <option key={item.id} value={item.id}>
                {idx + 1}. {item.title}
              </option>
            ))}
          </select>
        </div>

        <ol className="hidden lg:flex m-0 flex-col divide-y divide-track overflow-hidden rounded-panel border border-track bg-abyss/50 p-0 list-none">
          {javaLessons.map((item, idx) => {
            const selected = item.id === lesson.id
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => selectLesson(item.id)}
                  aria-pressed={selected}
                  className={`flex w-full flex-col gap-0.5 px-3.5 py-2.5 text-left cursor-pointer transition-colors ${
                    selected ? 'bg-navy-raised' : 'hover:bg-navy'
                  }`}
                >
                  <span className="text-sm font-extrabold text-cream">
                    {idx + 1}. {item.title}
                  </span>
                  <span className="text-xs text-cream-muted">{item.summary}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>

      {/* Conteúdo central da aula */}
      <article className="flex flex-col gap-6 bg-abyss p-4 md:p-6 lg:col-span-8 xl:col-span-9">
        <header className="rounded-panel border border-track bg-navy p-5">
          <span className="text-sm font-semibold text-cream-muted">
            Aula {lessonIndex + 1} de {javaLessons.length}
          </span>
          <h2 className="mt-1 text-2xl">{lesson.title}</h2>
          <div className="prose-copilot mt-3 flex flex-col gap-3 text-base text-cream">
            {lesson.paragraphs.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </header>

        {/* Painel lado a lado: No Nest/TypeScript e No backend do copilot */}
        <section aria-label="Comparação lado a lado" className="grid gap-4 xl:grid-cols-2">
          <div className="flex flex-col gap-2">
            <h3 className="text-base">No Nest/TypeScript</h3>
            <CodeBlock
              code={lesson.nest.code}
              language={lesson.nest.language}
              highlight={lesson.nest.highlight}
              title="No Nest/TypeScript"
              caption="Equivalente para comparação"
            />
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-base">No backend do copilot</h3>
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
          className="flex flex-col gap-3 rounded-panel border border-track bg-navy p-5"
        >
          <div>
            <h3 className="text-lg">Onde aparece no fluxo</h3>
            <p className="text-sm text-cream-muted">
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
                    className="flex h-full flex-col justify-between gap-2 rounded-panel border border-track bg-navy-raised p-4 hover:bg-track no-underline transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-extrabold text-cream">
                          {step ? `${step.className}${step.member ? `.${step.member}` : ''}` : link.stepId}
                        </span>
                        <Compass className="h-4 w-4 shrink-0 text-busy" />
                      </div>
                      <span className="mt-0.5 block text-xs text-cream-muted">
                        Fluxo: {flow?.title ?? link.flowId}
                      </span>
                    </div>
                    <p className="text-sm text-cream-muted">{link.note}</p>
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
