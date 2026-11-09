import { create } from 'zustand'

export const DEMO_STEPS = [
  { id: 'signup', label: 'Criar conta' },
  { id: 'signin', label: 'Entrar' },
  { id: 'upload', label: 'Enviar um PDF' },
  { id: 'track', label: 'Acompanhar o trilho até "Vetorizado"' },
  { id: 'journey', label: 'Ver a jornada da mensagem em "Por dentro"' },
  { id: 'ask', label: 'Fazer uma pergunta' },
  { id: 'xray', label: 'Abrir o caminho da resposta no Raio-X' },
  { id: 'prompt', label: 'Ver o prompt montado' },
] as const

export type DemoStepId = (typeof DEMO_STEPS)[number]['id']

const KEY = 'copilot.demo'

function load(): DemoStepId[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is DemoStepId => DEMO_STEPS.some((s) => s.id === id))
  } catch {
    return []
  }
}

interface DemoState {
  done: DemoStepId[]
  mark: (id: DemoStepId) => void
  reset: () => void
}

export const useDemo = create<DemoState>((set, get) => ({
  done: load(),
  mark: (id) => {
    if (get().done.includes(id)) return
    const done = [...get().done, id]
    try {
      localStorage.setItem(KEY, JSON.stringify(done))
    } catch {
      /* ignora */
    }
    set({ done })
  },
  reset: () => {
    try {
      localStorage.removeItem(KEY)
    } catch {
      /* ignora */
    }
    set({ done: [] })
  },
}))
