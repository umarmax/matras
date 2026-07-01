import { create } from 'zustand'
import { authenticateWithTelegram, signOut } from '../lib/auth'
import type { UserProfile } from '../types'

interface AuthState {
  user: UserProfile | null
  loading: boolean
  error: string | null
  initialized: boolean
  initAuth: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  initAuth: async () => {
    // Don't re-initialize if already done
    if (get().initialized) return

    set({ loading: true, error: null })

    try {
      const user = await authenticateWithTelegram()
      set({ user, loading: false, initialized: true })
    } catch (error) {
      set({
        loading: false,
        initialized: true,
        error: error instanceof Error ? error.message : 'Auth error',
      })
    }
  },

  logout: async () => {
    await signOut()
    set({ user: null, initialized: false })
  },
}))
