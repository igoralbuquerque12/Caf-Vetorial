import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, messageOf } from '../api/problem'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { useSession } from '../stores/session'
import { signIn } from '../stores/sessionActions'

interface FlowNode {
  layer: string
  title: string
  description: string
}

const FLOW_NODES: FlowNode[] = [
  {
    layer: 'Controller Layer',
    title: 'AuthController.login()',
    description: 'Recebe o POST /api/v1/auth/login',
  },
  {
    layer: 'Security Layer',
    title: 'AuthenticationManager.authenticate()',
    description: 'Inicia o processo de validação de credenciais',
  },
  {
    layer: 'Service Layer',
    title: 'AppUserDetailsService.loadUser()',
    description: 'Busca os detalhes do usuário pelo e-mail',
  },
  {
    layer: 'Data Access Layer',
    title: 'UserRepository.findByEmail()',
    description: 'Consulta SQL no PostgreSQL (users table)',
  },
  {
    layer: 'Utility Layer',
    title: 'JwtService.generateToken()',
    description: 'Emite o JWT Access Token após senha conferir',
  },
]

const TIME_PER_NODE_MS = 500

export function SignIn() {
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const notice = useSession((s) => s.notice)
  const clearNotice = useSession((s) => s.clearNotice)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [buttonStage, setButtonStage] = useState<'idle' | 'processing' | 'redirecting'>('idle')
  const [activeUpTo, setActiveUpTo] = useState<number>(-1)

  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  useEffect(() => {
    return () => clearTimers()
  }, [])

  const scheduleStepAnimation = (maxNodeIndex: number): Promise<void> => {
    clearTimers()
    if (reducedMotion) {
      setActiveUpTo(maxNodeIndex)
      return Promise.resolve()
    }

    return new Promise((resolve) => {
      for (let i = 0; i <= maxNodeIndex; i++) {
        const timerId = window.setTimeout(() => {
          setActiveUpTo(i)
          if (i === maxNodeIndex) {
            const doneTimerId = window.setTimeout(resolve, TIME_PER_NODE_MS)
            timersRef.current.push(doneTimerId)
          }
        }, i * TIME_PER_NODE_MS)
        timersRef.current.push(timerId)
      }
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    clearNotice()
    setFieldErrors({})
    setFormError(null)
    setActiveUpTo(-1)
    setBusy(true)
    setButtonStage('processing')

    const totalNodes = FLOW_NODES.length
    const animationPromise = scheduleStepAnimation(totalNodes - 1)

    try {
      await Promise.all([signIn({ email, password }), animationPromise])
      setButtonStage('redirecting')
      await new Promise<void>((resolve) => {
        const redirectTimer = window.setTimeout(resolve, reducedMotion ? 0 : 400)
        timersRef.current.push(redirectTimer)
      })
      navigate('/')
    } catch (error) {
      clearTimers()
      if (error instanceof ApiError) {
        if (Object.keys(error.fieldErrors).length > 0) {
          setActiveUpTo(0)
          setFieldErrors(error.fieldErrors)
        } else if (error.status === 401) {
          setActiveUpTo(3)
          setFormError('E-mail ou senha incorretos')
        } else {
          setActiveUpTo(-1)
          setFormError(messageOf(error))
        }
      } else {
        setActiveUpTo(-1)
        setFormError(messageOf(error))
      }
      setBusy(false)
      setButtonStage('idle')
    }
  }

  const progressHeight =
    activeUpTo <= 0
      ? '0%'
      : `calc(${(activeUpTo / (FLOW_NODES.length - 1)) * 100}% - 16px)`

  const buttonText =
    buttonStage === 'processing'
      ? 'Processando no Backend...'
      : buttonStage === 'redirecting'
        ? 'Redirecionando...'
        : 'Entrar no Sistema'

  return (
    <main className="min-h-screen bg-slate-950 text-slate-300 flex items-center justify-center p-6 antialiased">
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Coluna Esquerda: Educacional e Diagrama */}
        <section className="flex flex-col space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
              Copilot de <span className="text-cyan-400">Previdência</span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
              Envie PDFs e aprenda arquitetura Java acompanhando o caminho de cada requisição através das classes do
              backend.
            </p>
          </div>

          {/* Diagrama de Fluxo Spring Boot */}
          <div className="relative pt-4 pb-4 pl-4 md:pl-8" aria-label="Caminho do login no backend (POST /api/v1/auth/login)">
            {/* Linha vertical de conexão */}
            <div className="absolute left-[23px] md:left-[39px] top-8 bottom-8 w-0.5 bg-slate-800 z-0" />
            {/* Linha animada de progresso */}
            <div
              className="absolute left-[23px] md:left-[39px] top-8 w-0.5 bg-cyan-400 z-10 transition-all duration-300 ease-out"
              style={{ height: progressHeight }}
            />

            <div className="space-y-8 relative z-20">
              {FLOW_NODES.map((node, index) => {
                const isActive = index <= activeUpTo
                return (
                  <div key={node.title} className="flex items-start group" data-index={index}>
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center relative z-20 transition-all duration-400 ease-out ${
                          isActive
                            ? 'bg-cyan-400 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
                            : 'border-slate-600 bg-slate-950'
                        }`}
                      />
                    </div>
                    <div
                      className={`ml-6 border backdrop-blur-sm rounded-lg px-4 py-3 w-full max-w-md transition-all duration-400 ease-out ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-400/5 text-white'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        {node.layer}
                      </div>
                      <div
                        className={`font-mono text-sm font-semibold transition-colors duration-400 ${
                          isActive ? 'text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        {node.title}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{node.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Coluna Direita: Formulário de Login */}
        <section className="w-full max-w-md mx-auto lg:ml-auto">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            {/* Brilho sutil no fundo do card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <h2 className="text-2xl font-semibold text-white mb-2 relative z-10">Entrar</h2>
            <p className="text-sm text-slate-400 mb-8 relative z-10">
              Acesse sua conta para abrir o Workspace.
            </p>

            {notice && (
              <div
                role="status"
                className="mb-5 rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-200 relative z-10"
              >
                {notice}
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300 relative z-10"
              >
                {formError}
              </div>
            )}

            <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5 relative z-10">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.email) || undefined}
                  aria-describedby={fieldErrors.email ? 'email-err' : undefined}
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-600 ${
                    fieldErrors.email ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="voce@exemplo.com"
                />
                {fieldErrors.email && (
                  <p id="email-err" role="alert" className="mt-1.5 text-xs text-red-400">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Senha
                </label>
                <input
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(fieldErrors.password) || undefined}
                  aria-describedby={fieldErrors.password ? 'password-err' : undefined}
                  className={`w-full bg-slate-950 border rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors placeholder-slate-600 ${
                    fieldErrors.password ? 'border-red-500' : 'border-slate-700'
                  }`}
                  placeholder="••••••••"
                />
                {fieldErrors.password && (
                  <p id="password-err" role="alert" className="mt-1.5 text-xs text-red-400">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="flex items-center text-sm text-slate-400 cursor-pointer hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="mr-2 rounded border-slate-700 bg-slate-950 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-slate-900"
                  />
                  Lembrar-me
                </label>
                <Link
                  to="/cadastro"
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors no-underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              <button
                type="submit"
                disabled={busy}
                className={`w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg px-4 py-3 mt-4 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-500/20 flex justify-center items-center cursor-pointer ${
                  busy ? 'opacity-80 cursor-not-allowed' : ''
                }`}
              >
                <span>{buttonText}</span>
                {buttonStage === 'processing' && (
                  <svg
                    className="animate-spin ml-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-8 relative z-10">
              Ainda não tem conta?{' '}
              <Link
                to="/cadastro"
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors no-underline"
              >
                Criar conta
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  )
}
