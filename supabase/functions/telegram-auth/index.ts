// Supabase Edge Function: telegram-auth
// Deploy: supabase functions deploy telegram-auth
//
// Validates Telegram initData HMAC-SHA256 per official docs:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 * Returns parsed user object if valid, throws otherwise.
 */
async function validateTelegramInitData(
  initData: string,
  botToken: string,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  if (!hash) throw new Error('Missing hash in initData')

  // Build data-check-string: sorted key=value pairs (excluding hash), joined by \n
  const entries: string[] = []
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') entries.push(`${key}=${value}`)
  }
  entries.sort()
  const dataCheckString = entries.join('\n')

  // HMAC-SHA256(data-check-string, HMAC-SHA256("WebAppData", bot_token))
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

  if (computedHash !== hash) {
    throw new Error('Invalid initData signature')
  }

  // Check auth_date is not older than 24 hours
  const authDate = Number(params.get('auth_date') ?? '0')
  const now = Math.floor(Date.now() / 1000)
  if (now - authDate > 86400) {
    throw new Error('initData expired')
  }

  const userRaw = params.get('user')
  if (!userRaw) throw new Error('No user in initData')
  return JSON.parse(userRaw) as Record<string, unknown>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { initData } = await req.json()
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')

    if (!botToken || !initData) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // In development without real initData, fall through gracefully
    let tgUser: Record<string, unknown>
    try {
      tgUser = await validateTelegramInitData(initData, botToken)
    } catch (validationError) {
      return new Response(
        JSON.stringify({ error: String(validationError) }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    if (!tgUser?.id) {
      return new Response(JSON.stringify({ error: 'Invalid user data' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: profile } = await supabase
      .from('profiles')
      .upsert(
        {
          telegram_id: tgUser.id,
          first_name: tgUser.first_name ?? '',
          last_name: tgUser.last_name ?? null,
          username: tgUser.username ?? null,
          photo_url: tgUser.photo_url ?? null,
        },
        { onConflict: 'telegram_id' },
      )
      .select('*')
      .single()

    return new Response(
      JSON.stringify({
        user: profile,
        // Tokens are empty — frontend uses anon key + RLS policies
        // For full auth integrate signInWithIdToken or custom JWT
        access_token: '',
        refresh_token: '',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
