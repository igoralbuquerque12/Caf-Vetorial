import type { Tone } from './statusHelpers'

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
  fail: 'text-red-300 border-red-500/30 bg-red-500/10',
  busy: 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10',
  muted: 'text-slate-300 border-slate-700/80 bg-slate-800/70',
}

const DOT_CLASSES: Record<Tone, string> = {
  ok: 'bg-emerald-400',
  fail: 'bg-red-400',
  busy: 'bg-cyan-400',
  muted: 'bg-slate-400',
}

export function StatusBadge({ label, tone = 'muted', dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      {dot && <span aria-hidden="true" className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_CLASSES[tone]}`} />}
      {label}
    </span>
  )
}
