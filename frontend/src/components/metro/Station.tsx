import type { ExternalSystem, FlowStep } from '../../flows/types'
import { EXTERNAL_LABELS, LAYER_META } from './metroMeta'

/** Glifos simples desenhados à mão (sem logotipos de marcas) para os sistemas externos. */
export function ExternalGlyph({ system, size = 14 }: { system: ExternalSystem; size?: number }) {
  switch (system) {
    case 'postgres':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <ellipse cx="8" cy="3.5" rx="5" ry="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M3 3.5V12.5C3 13.6 5.2 14.5 8 14.5C10.8 14.5 13 13.6 13 12.5V3.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M3 8C3 9.1 5.2 10 8 10C10.8 10 13 9.1 13 8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
    case 's3':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 4.5H12.5L11.5 13.5H4.5L3.5 4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M5.5 4.5C5.5 2.8 6.6 2 8 2C9.4 2 10.5 2.8 10.5 4.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      )
    case 'rabbitmq':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <rect x="2" y="5" width="3" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
          <rect x="6.5" y="5" width="3" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="5" width="3" height="6" rx="0.8" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      )
    case 'openai':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="3" r="1.7" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="3.5" cy="11.5" r="1.7" stroke="currentColor" strokeWidth="1.4" />
          <circle cx="12.5" cy="11.5" r="1.7" stroke="currentColor" strokeWidth="1.4" />
          <path d="M7 4.5L4.4 10M9 4.5L11.6 10M5.2 11.5H10.8" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      )
  }
}

export interface StationProps {
  step: FlowStep
  index: number
  selected: boolean
  active: boolean
  isErrorTerminal?: boolean
  onSelect: (index: number) => void
  onOpenSheet?: (index: number) => void
}

export function Station({ step, index, selected, active, isErrorTerminal, onSelect, onOpenSheet }: StationProps) {
  const layerColor = LAYER_META[step.layer].color
  const borderColor = isErrorTerminal ? '#f87171' : selected ? '#22d3ee' : layerColor

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onOpenSheet) {
          e.preventDefault()
          onOpenSheet(index)
        }
      }}
      aria-pressed={selected}
      aria-label={`Estação ${index + 1}: ${step.className}${step.member ? `.${step.member}` : ''}`}
      className={`group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-all cursor-pointer border ${
        selected
          ? 'bg-cyan-400/10 border-cyan-400/60 text-white'
          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <span
        aria-hidden="true"
        style={{ borderColor }}
        className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
          active ? 'bg-slate-900' : 'bg-slate-950'
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            isErrorTerminal ? 'bg-red-400' : selected ? 'bg-cyan-400' : 'bg-slate-500'
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-mono text-xs font-semibold text-slate-200">
          {step.className}
          {step.member && <span className="font-normal text-slate-400">.{step.member}</span>}
        </span>
        {step.external && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-slate-400">
            <ExternalGlyph system={step.external} size={11} />
            <span>{EXTERNAL_LABELS[step.external]}</span>
          </span>
        )}
      </span>
    </button>
  )
}
