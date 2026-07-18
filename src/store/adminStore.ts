import { create } from 'zustand'
import { callAdmin, hasInitData } from '../lib/adminApi'
import { isSupabaseConfigured } from '../lib/supabase'
import type { AdminRole } from '../types'

interface AdminState {
  role: AdminRole | null
  checked: boolean
  checking: boolean
  isOwner: () => boolean
  checkAdmin: () => Promise<void>
}

export const useAdminStore = create<AdminState>((set, get) => ({
  role: null,
  checked: false,
  checking: false,

  isOwner: () => get().role === 'owner',

  // Determines whether the current Telegram user is an admin.
  // Backend-validated: a non-admin (or missing/invalid initData) yields role = null,
  // so the Admin Panel entry never renders for customers.
  checkAdmin: async () => {
    if (get().checked || get().checking) return
    if (!isSupabaseConfigured || !hasInitData()) {
      set({ checked: true, role: null })
      return
    }
    set({ checking: true })
    try {
      const { role } = await callAdmin<{ role: AdminRole }>('whoami')
      set({ role: role ?? null, checked: true, checking: false })
    } catch {
      set({ role: null, checked: true, checking: false })
    }
  },
}))
