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
        className="inline-flex items-center rounded-full border border-track bg-abyss px-3 py-1 text-sm font-semibold text-sand hover:border-cream cursor-pointer"
      >
        {annotation}
      </button>
      {open && entry && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-30 mb-2 w-72 rounded-panel border border-track bg-navy-raised p-3 text-left text-sm text-cream shadow-lg"
        >
          <span className="block font-extrabold text-cream">{entry.term}</span>
          <span className="mt-1 block text-cream-muted">{entry.short}</span>
          {entry.nest && <span className="mt-1.5 block text-xs text-busy">No Nest: {entry.nest}</span>}
        </span>
      )}
    </span>
  )
}

export function StationSheet({ step, stepNumber, totalSteps }: { step: FlowStep; stepNumber: number; totalSteps: number }) {
  const layer = LAYER_META[step.layer]
  const lesson = step.javaLessonId ? javaLessons.find((l) => l.id === step.javaLessonId) : undefined

  return (
    <section
      aria-label={`Folha da estação ${step.className}`}
      className="flex flex-col gap-4 rounded-panel border border-track bg-navy-raised p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-track pb-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-cream-muted">
              Estação {stepNumber} de {totalSteps}
            </span>
            <StatusBadge label={layer.label} tone={step.async ? 'busy' : 'muted'} />
            {step.async && <StatusBadge label="Assíncrono (após a fila)" tone="busy" />}
            {step.external && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-track bg-navy px-2.5 py-0.5 text-sm text-cream">
                <ExternalGlyph system={step.external} size={13} />
                <span>{EXTERNAL_LABELS[step.external]}</span>
              </span>
            )}
          </div>
          <h3 className="mt-1.5 text-xl">
            {step.className}
            {step.member && <span className="font-semibold text-cream-muted">.{step.member}</span>}
          </h3>
        </div>
        {lesson && (
          <Link
            to={`/java?aula=${encodeURIComponent(lesson.id)}`}
            className="inline-flex items-center gap-2 rounded-control border border-track bg-navy px-3 py-1.5 text-sm font-semibold text-cream hover:bg-track no-underline"
          >
            <BookOpen className="h-4 w-4 text-busy" />
            <span>Aula: {lesson.title}</span>
          </Link>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-panel border border-track bg-navy p-4">
          <h4 className="text-base text-cream">O que acontece nesta estação</h4>
          <p className="prose-copilot mt-1.5 text-base text-cream-muted">{step.explanation}</p>
        </div>
        <div className="rounded-panel border border-track bg-navy p-4">
          <h4 className="text-base text-cream">Equivalente no Nest / TypeScript</h4>
          <p className="prose-copilot mt-1.5 text-base text-cream-muted">{step.nestEquivalent}</p>
        </div>
      </div>

      {((step.annotations && step.annotations.length > 0) || (step.dependencies && step.dependencies.length > 0)) && (
        <div className="flex flex-wrap gap-6">
          {step.annotations && step.annotations.length > 0 && (
            <div>
              <span className="block text-sm font-semibold text-cream-muted">Anotações (passe o mouse ou clique)</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.annotations.map((ann) => (
                  <AnnotationChip key={ann} annotation={ann} />
                ))}
              </div>
            </div>
          )}
          {step.dependencies && step.dependencies.length > 0 && (
            <div>
              <span className="block text-sm font-semibold text-cream-muted">Dependências injetadas no construtor</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {step.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="inline-flex items-center rounded-full border border-track bg-navy px-3 py-1 text-sm font-semibold text-cream"
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
