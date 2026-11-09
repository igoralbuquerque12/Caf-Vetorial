import { login, logout } from '../api/auth'
import { refreshAccessToken } from '../api/client'
import type { Credentials } from '../api/auth'
import { createUser, getMe } from '../api/users'
import { useDemo } from './demo'
import { useInspector } from './inspector'
import { useSession } from './session'

/** Entra: login, depois /users/me. */
export async function signIn(credentials: Credentials): Promise<void> {
  const tokens = await login(credentials)
  useSession.getState().setTokens(tokens.accessToken, tokens.refreshToken)
  const me = await getMe()
  useSession.getState().setUser(me)
  useDemo.getState().mark('signin')
}

/** Cria a conta e entra automaticamente. */
export async function signUp(credentials: Credentials): Promise<void> {
  await createUser(credentials)
  useDemo.getState().mark('signup')
  await signIn(credentials)
}

/** Boot do app: com refresh token salvo, renova a sessão e busca /users/me. */
export async function bootstrapSession(): Promise<void> {
  const { refreshToken } = useSession.getState()
  if (!refreshToken) {
    useSession.getState().setPhase('anonymous')
    return
  }
  try {
    await refreshAccessToken()
    const me = await getMe()
    useSession.getState().setUser(me)
  } catch {
    // refreshAccessToken já limpou a sessão e definiu a mensagem; falhas no /me só deixam anônimo.
    if (useSession.getState().phase !== 'anonymous') useSession.getState().clear()
  }
}

/** Sai: chama /auth/logout (idempotente no servidor), limpa a sessão e o inspetor. */
export async function signOut(): Promise<void> {
  const { refreshToken } = useSession.getState()
  try {
    if (refreshToken) await logout(refreshToken)
  } catch {
    /* mesmo com falha de rede, a sessão local é encerrada */
  }
  useSession.getState().clear()
  useInspector.getState().clear()
}
