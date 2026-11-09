import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { getApiUrl } from './config'
import { AppRoutes } from './router'
import { bootstrapSession } from './stores/sessionActions'

export function ConfigErrorScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-abyss p-6 text-cream">
      <section
        role="alert"
        className="flex max-w-xl flex-col gap-3 rounded-panel border border-fail/60 bg-navy p-6"
      >
        <h1 className="text-2xl text-fail">Configuração obrigatória ausente: VITE_API_URL</h1>
        <p className="prose-copilot text-base text-cream-muted">
          O frontend conversa com o backend exclusivamente por HTTP através do endereço definido em{' '}
          <code>VITE_API_URL</code>. Crie um arquivo <code>frontend/.env</code> a partir de{' '}
          <code>frontend/.env.example</code> e reinicie o servidor de desenvolvimento:
        </p>
        <pre className="m-0 rounded-control border border-track bg-abyss p-3.5 text-xs text-cream">
          VITE_API_URL=http://localhost:8080
        </pre>
      </section>
    </main>
  )
}

export default function App() {
  const apiUrl = getApiUrl()
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  useEffect(() => {
    if (!apiUrl) return
    void bootstrapSession()
  }, [apiUrl])

  if (!apiUrl) {
    return <ConfigErrorScreen />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
