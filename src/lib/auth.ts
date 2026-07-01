import { WebApp } from './telegram'
import { isSupabaseConfigured, supabase } from './supabase'
import type { UserProfile } from '../types'

interface TelegramAuthResponse {
  access_token?: string
  refresh_token?: string
  user?: UserProfile
}

function buildDevProfile(): UserProfile {
  const tgUser = WebApp.initDataUnsafe.user

  return {
    id: 'dev-user',
    telegram_id: tgUser?.id ?? 0,
    first_name: tgUser?.first_name ?? 'Гость',
    last_name: tgUser?.last_name ?? null,
    username: tgUser?.username ?? null,
    photo_url: tgUser?.photo_url ?? null,
  }
}

export async function authenticateWithTelegram(): Promise<UserProfile | null> {
  const initData = WebApp.initData

  if (!initData) {
    return buildDevProfile()
  }

  if (!isSupabaseConfigured) {
    return buildDevProfile()
  }

  const { data, error } = await supabase.functions.invoke<TelegramAuthResponse>(
    'telegram-auth',
    { body: { initData } },
  )

  if (error) {
    console.warn('[Auth] Edge Function недоступна, используем локальный профиль')
    return buildDevProfile()
  }

  if (data?.access_token && data.refresh_token) {
    await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    })
  }

  return data?.user ?? buildDevProfile()
}

export async function signOut() {
  await supabase.auth.signOut()
}
