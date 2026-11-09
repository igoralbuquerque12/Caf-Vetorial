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
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-track bg-navy px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-base font-extrabold text-cream">Copilot de Previdência</span>
          <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-control px-3 py-1.5 text-sm font-semibold no-underline transition-colors ${
                    isActive
                      ? 'bg-navy-raised text-cream border border-track'
                      : 'text-cream-muted hover:text-cream hover:bg-navy-raised border border-transparent'
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
            <ListChecks className="h-4 w-4 text-busy" />
            <span>
              Roteiro ({done.length}/{DEMO_STEPS.length})
            </span>
          </Button>
          {user && (
            <span className="text-sm text-cream-muted" title="Usuário autenticado via /api/v1/users/me">
              {user.email}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={() => void handleSignOut()}>
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      <Drawer open={demoOpen} title="Roteiro de demonstração" onClose={() => setDemoOpen(false)}>
        <div className="flex flex-col gap-5">
          <p className="prose-copilot text-sm text-cream-muted">
            Os itens abaixo se marcam sozinhos conforme você usa o produto. O progresso fica salvo no{' '}
            <code>localStorage</code>.
          </p>

          <ol className="m-0 flex flex-col divide-y divide-track rounded-panel border border-track bg-abyss p-0 list-none">
            {DEMO_STEPS.map((step, idx) => {
              const checked = done.includes(step.id)
              return (
                <li key={step.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  {checked ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-ok" aria-label="Concluído" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-cream-muted" aria-label="Pendente" />
                  )}
                  <span className={checked ? 'text-cream font-semibold' : 'text-cream-muted'}>
                    {idx + 1}. {step.label}
                  </span>
                </li>
              )
            })}
          </ol>

          <div className="rounded-panel border border-track bg-navy-raised p-4">
            <h3 className="text-base">Testar renovação automática da sessão (single-flight)</h3>
            <p className="prose-copilot mt-1 text-sm text-cream-muted">
              O access token mora apenas em memória. Você pode descartá-lo agora para ver a próxima chamada renovar a
              sessão via <code>POST /api/v1/auth/refresh</code> automaticamente.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
