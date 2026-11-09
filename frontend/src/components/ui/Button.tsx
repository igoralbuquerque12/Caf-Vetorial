import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 'primary' é laranja. Use apenas no botão principal de cada região:
   * "Entrar", "Criar conta", "Enviar PDF" e "Perguntar".
   */
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  children: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-orange-500 text-white font-semibold hover:bg-orange-600 shadow-md shadow-orange-500/20 border border-orange-400/20',
  secondary:
    'bg-slate-800/80 text-slate-200 border border-slate-700/80 font-medium hover:bg-slate-800 hover:border-slate-600 hover:text-white',
  ghost:
    'bg-transparent text-slate-400 border border-transparent font-medium hover:text-slate-100 hover:bg-slate-800/60',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg cursor-pointer select-none transition-all duration-150 disabled:opacity-45 disabled:cursor-not-allowed ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
