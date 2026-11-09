import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, messageOf } from '../api/problem'
import { MetroMap } from '../components/metro/MetroMap'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { userRegister } from '../flows/userFlows'
import { signUp } from '../stores/sessionActions'

export function SignUp() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFieldErrors({})
    setFormError(null)
    setBusy(true)
    try {
      await signUp({ email, password })
      navigate('/')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setFieldErrors({ email: error.problem?.detail || 'E-mail já cadastrado' })
        } else if (Object.keys(error.fieldErrors).length > 0) {
          setFieldErrors(error.fieldErrors)
        } else {
          setFormError(messageOf(error))
        }
      } else {
        setFormError(messageOf(error))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-abyss text-cream flex items-center justify-center p-4 md:p-8">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-12 items-start">
        {/* Lado esquerdo: nome, frase e mapa compacto do cadastro */}
        <section className="lg:col-span-7 flex flex-col gap-4">
          <div>
            <h1 className="text-3xl">Copilot de Previdência</h1>
            <p className="prose-copilot mt-2 text-lg text-cream-muted">
              Um cliente para testar o RAG de previdência privada e enxergar como o Spring Boot valida, criptografa e
              persiste cada operação.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h2 className="text-base text-cream">Caminho do cadastro no backend (POST /api/v1/users)</h2>
            <MetroMap
              flow={userRegister}
              variant={userRegister.variants[0]}
              compact
              animateDraw
              showControls={false}
            />
          </div>
        </section>

        {/* Lado direito: formulário */}
        <section className="lg:col-span-5 rounded-panel border border-track bg-navy p-6">
          <h2 className="text-xl">Criar conta</h2>
          <p className="mt-1 text-sm text-cream-muted">
            Depois do cadastro, o aplicativo faz login automaticamente.
          </p>

          {formError && (
            <div role="alert" className="mt-4 rounded-control border border-fail/50 bg-fail/10 px-3.5 py-2.5 text-sm text-fail">
              {formError}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-5 flex flex-col gap-4">
            <Field
              label="E-mail"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              placeholder="voce@exemplo.com"
            />

            <Field
              label="Senha"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              hint="Entre 8 e 72 caracteres (limite do BCrypt)."
              placeholder="Mínimo de 8 caracteres"
            />

            {/* Único botão laranja da tela de cadastro */}
            <Button type="submit" variant="primary" disabled={busy} className="mt-1 w-full">
              {busy ? 'Criando conta…' : 'Criar conta'}
            </Button>
          </form>

          <p className="mt-5 text-sm text-cream-muted">
            Já tem conta?{' '}
            <Link to="/entrar" className="font-semibold text-cream">
              Entrar
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
