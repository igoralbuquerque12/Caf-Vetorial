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
    <div role="tablist" aria-label={ariaLabel} className={`inline-flex flex-wrap gap-1 rounded-control bg-abyss p-1 border border-track ${className}`}>
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-semibold cursor-pointer transition-colors ${
              active ? 'bg-navy-raised text-cream border border-track' : 'text-cream-muted hover:text-cream border border-transparent'
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
