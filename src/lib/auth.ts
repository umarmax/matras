import { WebApp } from './telegram'
import { isSupabaseConfigured, supabase } from './supabase'
import type { UserProfile } from '../types'

interface TelegramAuthResponse {
  access_token?: string
  refresh_token?: string
  user?: UserProfile
}

function buildProfileFromWebApp(): UserProfile | null {
  try {
    const tgUser = WebApp.initDataUnsafe?.user
    if (!tgUser?.id) return null

    return {
      id: `tg-${tgUser.id}`,
      telegram_id: tgUser.id,
      first_name: tgUser.first_name ?? '',
      last_name: tgUser.last_name ?? null,
      username: tgUser.username ?? null,
      photo_url: tgUser.photo_url ?? null,
    }
  } catch {
    return null
  }
}

function buildGuestProfile(): UserProfile {
  return {
    id: 'dev-user',
    telegram_id: 0,
    first_name: '',
    last_name: null,
    username: null,
    photo_url: null,
  }
}

export async function authenticateWithTelegram(): Promise<UserProfile | null> {
  // First try to get user from WebApp directly (most reliable)
  const webAppProfile = buildProfileFromWebApp()

  // If no initData, return WebApp profile or guest
  const initData = (() => {
    try { return WebApp.initData } catch { return '' }
  })()

  if (!initData) {
    return webAppProfile ?? buildGuestProfile()
  }

  if (!isSupabaseConfigured) {
    return webAppProfile ?? buildGuestProfile()
  }

  // Try to authenticate via Edge Function
  try {
    const { data, error } = await supabase.functions.invoke<TelegramAuthResponse>(
      'telegram-auth',
      { body: { initData } },
    )

    if (error || !data?.user) {
      console.warn('[Auth] Edge Function failed, using WebApp data:', error?.message)
      return webAppProfile ?? buildGuestProfile()
    }

    return data.user
  } catch (e) {
    console.warn('[Auth] Auth exception, using WebApp data:', e)
    return webAppProfile ?? buildGuestProfile()
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}
