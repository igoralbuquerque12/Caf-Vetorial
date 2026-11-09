import type { ReactNode } from 'react'

export interface TabItem<T extends string> {
  id: T
  label: string
  badge?: ReactNode
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
}: {
  items: ReadonlyArray<TabItem<T>>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap gap-1 rounded-lg bg-slate-950/80 p-1 border border-slate-800/90 ${className}`}
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-all ${
              active
                ? 'bg-slate-800 text-cyan-400 border border-slate-700/80 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <span>{item.label}</span>
            {item.badge}
          </button>
        )
      })}
    </div>
  )
}
