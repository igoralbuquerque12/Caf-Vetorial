import type { Tone } from './statusHelpers'

const TONE_CLASSES: Record<Tone, string> = {
  ok: 'text-ok border-ok/40 bg-ok/10',
  fail: 'text-fail border-fail/40 bg-fail/10',
  busy: 'text-busy border-busy/40 bg-busy/10',
  muted: 'text-cream-muted border-track bg-navy-raised',
}

const DOT_CLASSES: Record<Tone, string> = {
  ok: 'bg-ok',
  fail: 'bg-fail',
  busy: 'bg-busy',
  muted: 'bg-cream-muted',
}

export function StatusBadge({ label, tone = 'muted', dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-sm font-semibold ${TONE_CLASSES[tone]}`}>
      {dot && <span aria-hidden="true" className={`h-2 w-2 rounded-full ${DOT_CLASSES[tone]}`} />}
      {label}
    </span>
  )
}
