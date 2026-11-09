import { X } from 'lucide-react'
import { useToasts, type ToastTone } from '../../stores/toasts'

const BAR: Record<ToastTone, string> = {
  ok: 'bg-emerald-400',
  fail: 'bg-red-400',
  info: 'bg-cyan-400',
}

export function ToastRegion() {
  const { toasts, dismiss } = useToasts()
  if (toasts.length === 0) return null
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className="flex items-stretch overflow-hidden rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md text-slate-100 shadow-xl"
        >
          <span aria-hidden="true" className={`w-1.5 shrink-0 ${BAR[toast.tone]}`} />
          <p className="flex-1 px-3.5 py-2.5 text-xs">{toast.message}</p>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Fechar aviso"
            className="px-2.5 text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
