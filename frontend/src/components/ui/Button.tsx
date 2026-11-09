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
  primary: 'bg-orange text-abyss font-extrabold hover:brightness-105',
  secondary: 'bg-navy-raised text-cream border border-track font-semibold hover:bg-track',
  ghost: 'bg-transparent text-cream-muted border border-transparent hover:text-cream hover:bg-navy-raised',
}

export function Button({ variant = 'secondary', size = 'md', className = '', type = 'button', children, ...rest }: ButtonProps) {
  const sizeClass = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-base'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-control cursor-pointer select-none transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${sizeClass} ${VARIANT_CLASSES[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
