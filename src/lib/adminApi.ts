import { supabase, isSupabaseConfigured } from './supabase'
import { WebApp } from './telegram'

function getInitData(): string {
  try {
    return WebApp.initData ?? ''
  } catch {
    return ''
  }
}

export interface AdminApiError {
  error: string
}

/**
 * Call the secure `admin-api` Edge Function. The function validates the
 * Telegram initData and the caller's admin role server-side, so the client
 * cannot escalate privileges. Throws on any non-2xx response.
 */
export async function callAdmin<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured')
  const initData = getInitData()
  if (!initData) throw new Error('Telegram authentication required')

  const { data, error } = await supabase.functions.invoke<T & AdminApiError>(
    'admin-api',
    { body: { initData, action, payload } },
  )

  if (error) throw new Error(error.message || 'Admin request failed')
  if (data && (data as AdminApiError).error) {
    throw new Error((data as AdminApiError).error)
  }
  return data as T
}

export function hasInitData(): boolean {
  return getInitData().length > 0
}
