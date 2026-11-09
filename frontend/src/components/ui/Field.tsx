import { useId, type InputHTMLAttributes } from 'react'

export interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Field({ label, hint, error, id, className = '', ...rest }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-err`
  const hintId = `${inputId}-hint`
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-base font-semibold text-cream">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        className={`w-full rounded-control bg-abyss px-3.5 py-2.5 text-base text-cream placeholder:text-cream-muted/60 border ${
          error ? 'border-fail' : 'border-track'
        } ${className}`}
        {...rest}
      />
      {hint && !error && (
        <p id={hintId} className="text-sm text-cream-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-fail">
          {error}
        </p>
      )}
    </div>
  )
}
