// Supabase Edge Function: admin-api
// Deploy: supabase functions deploy admin-api
//
// Single authenticated entry point for the in-app Admin Panel.
// Security model:
//   1. Every request carries Telegram `initData`, validated by HMAC-SHA256.
//   2. The verified telegram_user_id is looked up in `public.admins`.
//   3. Role (owner | sales_manager) gates each action — NEVER trust the client.
//   4. All DB access uses the service-role key (RLS-bypassing) only AFTER auth.
//
// Required env vars (Supabase Dashboard → Edge Functions):
//   TELEGRAM_BOT_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

type Role = 'owner' | 'sales_manager'

const OWNER_ONLY = new Set([
  'upsert_category',
  'delete_category',
  'list_admins',
  'upsert_admin',
  'delete_admin',
])

const VALID_STATUSES = new Set([
  'pending',
  'confirmed',
  'in_production',
  'ready',
  'delivered',
  'cancelled',
  'completed',
])

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Telegram initData HMAC validation (same algorithm as telegram-auth) ──
async function validateTelegramInitData(
  initData: string,
  botToken: string,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('Missing hash in initData')

  const entries: string[] = []
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') entries.push(`${key}=${value}`)
  }
  entries.sort()
  const dataCheckString = entries.join('\n')

  const enc = new TextEncoder()
  const secretKeyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const secretKey = await crypto.subtle.sign(
    'HMAC',
    secretKeyMaterial,
    enc.encode(botToken),
  )
  const hmacKey = await crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    hmacKey,
    enc.encode(dataCheckString),
  )
  const computedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  if (computedHash !== hash) throw new Error('Invalid initData signature')

  const authDate = Number(params.get('auth_date') ?? '0')
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) throw new Error('initData expired')

  const userRaw = params.get('user')
  if (!userRaw) throw new Error('No user in initData')
  return JSON.parse(userRaw) as Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!botToken || !supabaseUrl || !serviceKey) {
    return json({ error: 'Service unavailable' }, 503)
  }

  let body: { initData?: string; action?: string; payload?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  const { initData, action, payload = {} } = body
  if (!initData || !action) return json({ error: 'Missing initData or action' }, 400)

  // 1. Authenticate the Telegram user.
  let tgUser: Record<string, unknown>
  try {
    tgUser = await validateTelegramInitData(initData, botToken)
  } catch (e) {
    return json({ error: `Unauthorized: ${e instanceof Error ? e.message : e}` }, 401)
  }
  const telegramUserId = Number(tgUser.id)
  if (!telegramUserId) return json({ error: 'Invalid user' }, 401)

  const supabase = createClient(supabaseUrl, serviceKey)

  // 2. Authorize: must be an active admin.
  const { data: admin } = await supabase
    .from('admins')
    .select('telegram_user_id, role, active')
    .eq('telegram_user_id', telegramUserId)
    .eq('active', true)
    .maybeSingle()

  if (!admin) return json({ error: 'Forbidden' }, 403)
  const role = admin.role as Role

  // 3. Role gate.
  if (OWNER_ONLY.has(action) && role !== 'owner') {
    return json({ error: 'Owner role required' }, 403)
  }

  try {
    switch (action) {
      case 'whoami':
        return json({ role })

      case 'stats': {
        const now = Date.now()
        const dayAgo = new Date(now - 86400000).toISOString()
        const weekAgo = new Date(now - 7 * 86400000).toISOString()
        const monthAgo = new Date(now - 30 * 86400000).toISOString()

        const { data: rows } = await supabase
          .from('orders')
          .select('total, status, created_at')
          .gte('created_at', monthAgo)

        const orders = rows ?? []
        const notCancelled = orders.filter((o) => o.status !== 'cancelled')
        const revenue = notCancelled.reduce((s, o) => s + (o.total ?? 0), 0)
        const count = (since: string) =>
          orders.filter((o) => o.created_at >= since).length

        return json({
          today: count(dayAgo),
          week: count(weekAgo),
          month: orders.length,
          revenue,
          avg_order_value: notCancelled.length
            ? Math.round(revenue / notCancelled.length)
            : 0,
        })
      }

      case 'list_orders': {
        const status = typeof payload.status === 'string' ? payload.status : null
        const search = typeof payload.search === 'string' ? payload.search.trim() : ''
        let q = supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        if (status && VALID_STATUSES.has(status)) q = q.eq('status', status)
        if (search) {
          q = q.or(
            `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`,
          )
        }
        const { data, error } = await q
        if (error) throw error
        return json({ orders: data ?? [] })
      }

      case 'update_order_status': {
        const orderId = String(payload.order_id ?? '')
        const status = String(payload.status ?? '')
        if (!orderId || !VALID_STATUSES.has(status)) {
          return json({ error: 'Invalid order id or status' }, 400)
        }
        const { data, error } = await supabase
          .from('orders')
          .update({ status })
          .eq('id', orderId)
          .select('*')
          .single()
        if (error) throw error
        return json({ order: data })
      }

      case 'add_note': {
        const orderId = String(payload.order_id ?? '')
        const note = String(payload.note ?? '').slice(0, 1000)
        if (!orderId) return json({ error: 'Invalid order id' }, 400)
        const { data, error } = await supabase
          .from('orders')
          .update({ admin_note: note })
          .eq('id', orderId)
          .select('*')
          .single()
        if (error) throw error
        return json({ order: data })
      }

      case 'list_categories': {
        // Admins see all categories (including inactive).
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true })
        if (error) throw error
        return json({ categories: data ?? [] })
      }

      case 'upsert_category': {
        const c = payload as Record<string, unknown>
        const row: Record<string, unknown> = {
          slug: String(c.slug ?? '').trim(),
          name: String(c.name ?? '').trim(),
          description: c.description != null ? String(c.description) : null,
          image_url: c.image_url != null ? String(c.image_url) : null,
          active: c.active !== false,
          price_per_m2: Math.max(0, Math.round(Number(c.price_per_m2) || 0)),
          minimum_price:
            c.minimum_price == null || c.minimum_price === ''
              ? null
              : Math.max(0, Math.round(Number(c.minimum_price))),
          sort_order: Math.round(Number(c.sort_order) || 0),
          updated_at: new Date().toISOString(),
        }
        if (!row.slug || !row.name) {
          return json({ error: 'slug and name are required' }, 400)
        }
        if (c.id) row.id = c.id
        const { data, error } = await supabase
          .from('categories')
          .upsert(row, { onConflict: 'slug' })
          .select('*')
          .single()
        if (error) throw error
        return json({ category: data })
      }

      case 'list_admins': {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .order('created_at', { ascending: true })
        if (error) throw error
        return json({ admins: data ?? [] })
      }

      case 'upsert_admin': {
        const a = payload as Record<string, unknown>
        const tid = Number(a.telegram_user_id)
        const newRole = String(a.role ?? 'sales_manager')
        if (!tid || (newRole !== 'owner' && newRole !== 'sales_manager')) {
          return json({ error: 'Invalid telegram_user_id or role' }, 400)
        }
        const { data, error } = await supabase
          .from('admins')
          .upsert(
            {
              telegram_user_id: tid,
              name: a.name != null ? String(a.name) : null,
              role: newRole,
              active: a.active !== false,
            },
            { onConflict: 'telegram_user_id' },
          )
          .select('*')
          .single()
        if (error) throw error
        return json({ admin: data })
      }

      case 'delete_admin': {
        const tid = Number(payload.telegram_user_id)
        if (!tid) return json({ error: 'Invalid telegram_user_id' }, 400)
        if (tid === telegramUserId) {
          return json({ error: 'Cannot remove yourself' }, 400)
        }
        const { error } = await supabase
          .from('admins')
          .delete()
          .eq('telegram_user_id', tid)
        if (error) throw error
        return json({ ok: true })
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (e) {
    console.error('[admin-api] Error:', e)
    return json({ error: 'Request failed' }, 500)
  }
})
