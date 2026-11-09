import { create } from 'zustand'
import type { UserResponse } from '../api/types'

const REFRESH_KEY = 'copilot.refreshToken'

function readRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_KEY)
  } catch {
    return null
  }
}

function writeRefreshToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem(REFRESH_KEY, token)
    else sessionStorage.removeItem(REFRESH_KEY)
  } catch {
    /* sessionStorage indisponível: a sessão vale só para esta aba em memória */
  }
}

export type SessionPhase = 'booting' | 'anonymous' | 'authenticated'

interface SessionState {
  phase: SessionPhase
  /** O access token fica SOMENTE em memória. */
  accessToken: string | null
  /** O refresh token fica no sessionStorage (ver README: trade-off contra cookie HttpOnly). */
  refreshToken: string | null
  user: UserResponse | null
  /** Mensagem exibida na tela de entrada (ex.: sessão expirada). */
  notice: string | null
  setTokens: (access: string, refresh: string) => void
  setUser: (user: UserResponse) => void
  /** Limpa tudo e volta para anônimo. */
  clear: (notice?: string | null) => void
  setPhase: (phase: SessionPhase) => void
  clearNotice: () => void
  /** Apenas para testes e para a demonstração: descarta o access token da memória. */
  dropAccessToken: () => void
}

export const useSession = create<SessionState>((set) => ({
  phase: 'booting',
  accessToken: null,
  refreshToken: readRefreshToken(),
  user: null,
  notice: null,
  setTokens: (access, refresh) => {
    writeRefreshToken(refresh)
    set({ accessToken: access, refreshToken: refresh })
  },
  setUser: (user) => set({ user, phase: 'authenticated' }),
  clear: (notice = null) => {
    writeRefreshToken(null)
    set({ accessToken: null, refreshToken: null, user: null, phase: 'anonymous', notice })
  },
  setPhase: (phase) => set({ phase }),
  clearNotice: () => set({ notice: null }),
  dropAccessToken: () => set({ accessToken: null }),
}))
