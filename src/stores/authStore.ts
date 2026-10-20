import { create } from 'zustand'
import type { AuthResponse, UserProfile } from '@/types'

/**
 * The signed-in session: tokens plus the player's profile. Persisted per browser so a reload keeps you
 * signed in. Tokens are only ever sent to the Logicraft API.
 */

const STORAGE_KEY = 'codequest-session-v1'

interface Session {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null
}

interface AuthState extends Session {
  setSession: (session: AuthResponse) => void
  setUser: (user: UserProfile) => void
  clear: () => void
}

const empty: Session = { accessToken: null, refreshToken: null, user: null }

function load(): Session {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...empty, ...(JSON.parse(raw) as Partial<Session>) }
  } catch {
    // Unavailable or corrupt storage — signed out.
  }
  return empty
}

export const useAuthStore = create<AuthState>((set) => ({
  ...(typeof window === 'undefined' ? empty : load()),
  setSession: ({ tokens, user }) => set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user }),
  setUser: (user) => set({ user }),
  clear: () => set(empty),
}))

useAuthStore.subscribe(({ accessToken, refreshToken, user }) => {
  try {
    if (accessToken) window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ accessToken, refreshToken, user }))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — the session lasts until the tab closes.
  }
})

export const selectIsSignedIn = (s: AuthState) => !!s.accessToken
