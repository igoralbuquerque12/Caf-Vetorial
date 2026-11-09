import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { setSessionExpiredHandler } from './api/client'
import { ToastRegion } from './components/ui/Toast'
import { TopBar } from './components/ui/TopBar'
import { Inside } from './pages/Inside'
import { JavaForNest } from './pages/JavaForNest'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import { Workspace } from './pages/Workspace'
import { XRay } from './pages/XRay'
import { useSession } from './stores/session'

function ProtectedLayout() {
  const phase = useSession((s) => s.phase)

  if (phase === 'booting') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-abyss p-6 text-cream">
        <div role="status" className="rounded-panel border border-track bg-navy px-6 py-4 text-base text-cream-muted">
          Restaurando sua sessão…
        </div>
      </main>
    )
  }

  if (phase === 'anonymous') {
    return <Navigate to="/entrar" replace />
  }

  return (
    <div className="flex min-h-screen flex-col bg-abyss text-cream">
      <TopBar />
      <Outlet />
    </div>
  )
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const phase = useSession((s) => s.phase)
  if (phase === 'authenticated') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export function AppRoutes() {
  const navigate = useNavigate()

  useEffect(() => {
    setSessionExpiredHandler(() => {
      navigate('/entrar', { replace: true })
    })
  }, [navigate])

  return (
    <>
      <Routes>
        <Route
          path="/entrar"
          element={
            <PublicOnlyRoute>
              <SignIn />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/cadastro"
          element={
            <PublicOnlyRoute>
              <SignUp />
            </PublicOnlyRoute>
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Workspace />} />
          <Route path="/raio-x" element={<XRay />} />
          <Route path="/por-dentro" element={<Inside />} />
          <Route path="/java" element={<JavaForNest />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastRegion />
    </>
  )
}
