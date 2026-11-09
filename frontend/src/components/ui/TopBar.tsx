import { CheckCircle2, Circle, ListChecks, LogOut } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { DEMO_STEPS, useDemo } from '../../stores/demo'
import { useSession } from '../../stores/session'
import { signOut } from '../../stores/sessionActions'
import { useToasts } from '../../stores/toasts'
import { Button } from './Button'
import { Drawer } from './Drawer'

const NAV_ITEMS = [
  { to: '/', label: 'Workspace', end: true },
  { to: '/raio-x', label: 'Raio-X' },
  { to: '/por-dentro', label: 'Por dentro' },
  { to: '/java', label: 'Java para quem vem do Nest' },
]

export function TopBar() {
  const user = useSession((s) => s.user)
  const accessToken = useSession((s) => s.accessToken)
  const dropAccessToken = useSession((s) => s.dropAccessToken)
  const done = useDemo((s) => s.done)
  const resetDemo = useDemo((s) => s.reset)
  const pushToast = useToasts((s) => s.push)
  const navigate = useNavigate()
  const [demoOpen, setDemoOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/entrar')
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md px-4 lg:px-6 py-2.5">
        <div className="flex flex-wrap items-center gap-4 lg:gap-6">
          <span className="flex items-center gap-2 text-base font-bold tracking-tight text-white">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="h-6 w-6 rounded-md" />
            <span>
              Java<span className="text-cyan-400">Prev</span>
            </span>
          </span>
          <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs font-medium no-underline transition-all ${
                    isActive
                      ? 'bg-slate-800/90 text-cyan-400 border border-slate-700/80 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/70 border border-transparent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={() => setDemoOpen(true)}>
            <ListChecks className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              Roteiro ({done.length}/{DEMO_STEPS.length})
            </span>
          </Button>
          {user && (
            <span
              className="rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-400"
              title="Usuário autenticado via /api/v1/users/me"
            >
              {user.email}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => void handleSignOut()}>
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      <Drawer open={demoOpen} title="Roteiro de demonstração" onClose={() => setDemoOpen(false)}>
        <div className="flex flex-col gap-5">
          <p className="prose-copilot text-sm text-slate-400">
            Os itens abaixo se marcam sozinhos conforme você usa o produto. O progresso fica salvo no{' '}
            <code>localStorage</code>.
          </p>

          <ol className="m-0 flex flex-col divide-y divide-slate-800/80 rounded-xl border border-slate-800 bg-slate-950/60 p-0 list-none overflow-hidden">
            {DEMO_STEPS.map((step, idx) => {
              const checked = done.includes(step.id)
              return (
                <li key={step.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  {checked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-label="Concluído" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-slate-500" aria-label="Pendente" />
                  )}
                  <span className={checked ? 'text-slate-100 font-medium' : 'text-slate-400'}>
                    {idx + 1}. {step.label}
                  </span>
                </li>
              )
            })}
          </ol>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <h3 className="text-sm font-semibold text-white">Testar renovação automática da sessão (single-flight)</h3>
            <p className="prose-copilot mt-1.5 text-xs text-slate-400">
              O access token mora apenas em memória. Você pode descartá-lo agora para ver a próxima chamada renovar a
              sessão via <code>POST /api/v1/auth/refresh</code> automaticamente.
            </p>
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!accessToken}
                onClick={() => {
                  dropAccessToken()
                  pushToast('Access token removido da memória. A próxima ação fará refresh.', 'info')
                }}
              >
                {accessToken ? 'Descartar access token da memória' : 'Access token já está vazio'}
              </Button>
              <Button variant="ghost" size="sm" onClick={resetDemo}>
                Reiniciar progresso do roteiro
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  )
}
