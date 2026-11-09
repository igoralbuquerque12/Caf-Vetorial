import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'

export function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-abyss/80" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 flex h-full w-full max-w-2xl flex-col border-l border-track bg-navy">
        <header className="flex items-center justify-between gap-3 border-b border-track px-5 py-3.5">
          <h2 className="text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-control text-cream-muted hover:bg-navy-raised hover:text-cream cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}
