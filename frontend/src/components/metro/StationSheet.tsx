import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lookupGlossary } from '../../content/glossary'
import { javaLessons } from '../../content/javaLessons'
import type { FlowStep } from '../../flows/types'
import { CodeBlock } from '../code/CodeBlock'
import { StatusBadge } from '../ui/StatusBadge'
import { EXTERNAL_LABELS, LAYER_META } from './metroMeta'
import { ExternalGlyph } from './Station'

function AnnotationChip({ annotation }: { annotation: string }) {
  const [open, setOpen] = useState(false)
  const entry = lookupGlossary(annotation)

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-950 px-3 py-1 font-mono text-xs font-medium text-amber-300 hover:border-amber-400/60 cursor-pointer transition-colors"
      >
        {annotation}
      </button>
      {open && entry && (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 w-72 max-w-[calc(100vw-3rem)] rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-xs text-slate-100 shadow-2xl"
        >
          <span className="block font-mono font-semibold text-amber-300">{entry.term}</span>
          <span className="mt-1 block text-slate-300 leading-relaxed">{entry.short}</span>
          {entry.nest && <span className="mt-1.5 block text-[11px] text-cyan-400">No Nest: {entry.nest}</span>}
        </span>
      )}
    </span>
  )
}

export function StationSheet({
  step,
  stepNumber,
  totalSteps,
}: {
  step: FlowStep
  stepNumber: number
  totalSteps: number
}) {
  const layer = LAYER_META[step.layer]
  const lesson = step.javaLessonId ? javaLessons.find((l) => l.id === step.javaLessonId) : undefined

  return (
    <section
      aria-label={`Folha da estação ${step.className}`}
      className="flex flex-col gap-4 rounded-xl border border-slate-800/90 bg-slate-900/70 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              Estação {stepNumber} de {totalSteps}
            </span>
            <StatusBadge label={layer.label} tone={step.async ? 'busy' : 'muted'} />
            {step.async && <StatusBadge label="Assíncrono (após a fila)" tone="busy" />}
            {step.external && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-950/70 px-2.5 py-0.5 text-xs text-slate-200">
                <ExternalGlyph system={step.external} size={12} />
                <span>{EXTERNAL_LABELS[step.external]}</span>
              </span>
            )}
          </div>
          <h3 className="mt-2 font-mono text-lg font-semibold text-white">
            {step.className}
            {step.member && <span className="font-normal text-cyan-400">.{step.member}</span>}
          </h3>
        </div>
        {lesson && (
          <Link
            to={`/java?aula=${encodeURIComponent(lesson.id)}`}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-cyan-400/50 hover:text-white no-underline transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
            <span>Aula: {lesson.title}</span>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h4 className="text-sm font-semibold text-white">O que acontece nesta estação</h4>
          <p className="prose-copilot mt-1.5 text-sm text-slate-300">{step.explanation}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4">
          <h4 className="text-sm font-semibold text-white">Equivalente no Nest / TypeScript</h4>
          <p className="prose-copilot mt-1.5 text-sm text-slate-300">{step.nestEquivalent}</p>
        </div>
      </div>

      {((step.annotations && step.annotations.length > 0) || (step.dependencies && step.dependencies.length > 0)) && (
        <div className="flex flex-wrap gap-6">
          {step.annotations && step.annotations.length > 0 && (
            <div>
              <span className="block text-xs font-medium text-slate-400">Anotações (passe o mouse ou clique)</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.annotations.map((ann) => (
                  <AnnotationChip key={ann} annotation={ann} />
                ))}
              </div>
            </div>
          )}
          {step.dependencies && step.dependencies.length > 0 && (
            <div>
              <span className="block text-xs font-medium text-slate-400">Dependências injetadas no construtor</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="inline-flex items-center rounded-full border border-slate-800 bg-slate-950/70 px-3 py-1 font-mono text-xs font-medium text-slate-200"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step.snippet && (
        <CodeBlock
          code={step.snippet.code}
          language={step.snippet.language}
          highlight={step.snippet.highlight}
          title={`${step.className}${step.member ? `.${step.member}` : ''}`}
        />
      )}
    </section>
  )
}
