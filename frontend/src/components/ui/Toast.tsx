import { X } from 'lucide-react'
import { useToasts, type ToastTone } from '../../stores/toasts'

const BAR: Record<ToastTone, string> = {
  ok: 'bg-ok',
  fail: 'bg-fail',
  info: 'bg-busy',
}

export function ToastRegion() {
  const { toasts, dismiss } = useToasts()
  if (toasts.length === 0) return null
  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="flex items-stretch overflow-hidden rounded-panel border border-track bg-navy-raised text-cream"
        >
          <span aria-hidden="true" className={`w-1.5 shrink-0 ${BAR[toast.tone]}`} />
          <p className="flex-1 px-3.5 py-2.5 text-sm">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Fechar aviso"
            className="px-2.5 text-cream-muted hover:text-cream cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
