// Supabase Edge Function: telegram-bot
// Deploy: supabase functions deploy telegram-bot
//
// 1. Register webhook with Telegram:
//    POST https://api.telegram.org/bot<TOKEN>/setWebhook
//    Body: { 
//      "url": "https://<project>.supabase.co/functions/v1/telegram-bot",
//      "secret_token": "your-random-secret-string"
//    }
//
// 2. Required env vars in Supabase Dashboard → Settings → Edge Functions:
//    TELEGRAM_BOT_TOKEN          — from @BotFather
//    TELEGRAM_ADMIN_CHAT_ID      — your personal Telegram chat ID (get from @userinfobot)
//    MINI_APP_URL                — your deployed mini app URL (e.g. https://matras.vercel.app)
//    TELEGRAM_WEBHOOK_SECRET     — random string for webhook validation (optional but recommended)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_API = 'https://api.telegram.org'

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
}

interface TelegramMessage {
  message_id: number
  from?: TelegramUser
  chat: TelegramChat
  text?: string
}

interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  data?: string
  message?: TelegramMessage
}

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface TelegramChat {
  id: number
  type: string
}

// HTML escape to prevent XSS in Telegram messages
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

// Rate limiting for notification endpoint
const notificationRateLimit = new Map<string, number[]>()

function checkNotificationRateLimit(orderId: string): boolean {
  const now = Date.now()
  const timestamps = notificationRateLimit.get(orderId) || []
  
  // Remove timestamps older than 1 minute
  const recentTimestamps = timestamps.filter(t => now - t < 60000)
  
  // Max 3 notifications per order per minute
  if (recentTimestamps.length >= 3) {
    return false
  }
  
  recentTimestamps.push(now)
  notificationRateLimit.set(orderId, recentTimestamps)
  
  // Cleanup old entries (keep last 1000)
  if (notificationRateLimit.size > 1000) {
    const oldestKey = notificationRateLimit.keys().next().value
    notificationRateLimit.delete(oldestKey)
  }
  
  return true
}

async function sendMessage(
  botToken: string,
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>,
) {
  const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
  return res.json()
}

async function answerCallbackQuery(
  botToken: string,
  callbackQueryId: string,
  text?: string,
) {
  await fetch(`${TELEGRAM_API}/bot${botToken}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

/**
 * Notify admin about a new order.
 * Called from create-order Edge Function after successful order creation
 */
async function notifyAdminNewOrder(
  botToken: string,
  adminChatId: string,
  order: {
    id: string
    total: number
    customer_name: string | null
    customer_phone: string | null
    delivery_address: string | null
    comment: string | null
    telegram_username: string | null
    items: Array<{ name: string; width: number; length: number; quantity: number; price: number }>
  },
) {
  // Sanitize all user inputs to prevent XSS
  const safeName = order.customer_name ? escapeHtml(order.customer_name) : '—'
  const safePhone = order.customer_phone ? escapeHtml(order.customer_phone) : null
  const safeAddress = order.delivery_address ? escapeHtml(order.delivery_address) : null
  const safeComment = order.comment ? escapeHtml(order.comment) : null
  const safeUsername = order.telegram_username ? escapeHtml(order.telegram_username) : null

  // Limit comment length for Telegram (max 4096 chars per message)
  const truncatedComment = safeComment && safeComment.length > 200 
    ? safeComment.slice(0, 200) + '...' 
    : safeComment

  const itemLines = order.items
    .map(
      (i) =>
        `  • ${escapeHtml(i.name)} ${i.width}×${i.length} см × ${i.quantity} шт — ${(i.price * i.quantity).toLocaleString('ru')} ₽`,
    )
    .join('\n')

  const text = [
    `🛏 <b>Новый заказ #${order.id.slice(0, 8)}</b>`,
    '',
    `💰 <b>Итого:</b> ${order.total.toLocaleString('ru')} ₽`,
    '',
    `👤 <b>Клиент:</b> ${safeName}`,
    safePhone ? `📞 <b>Телефон:</b> ${safePhone}` : null,
    safeAddress ? `📍 <b>Адрес:</b> ${safeAddress}` : null,
    safeUsername ? `✈️ <b>Telegram:</b> @${safeUsername}` : null,
    truncatedComment ? `💬 <b>Комментарий:</b> ${truncatedComment}` : null,
    '',
    `<b>Состав заказа:</b>`,
    itemLines,
  ]
    .filter((l) => l !== null)
    .join('\n')

  await sendMessage(botToken, adminChatId, text, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '✅ Подтвердить',
            callback_data: `confirm_order:${order.id}`,
          },
          {
            text: '❌ Отменить',
            callback_data: `cancel_order:${order.id}`,
          },
        ],
      ],
    },
  })
}

Deno.serve(async (req) => {
  // Validate required environment variables
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const adminChatId = Deno.env.get('TELEGRAM_ADMIN_CHAT_ID')
  const miniAppUrl = Deno.env.get('MINI_APP_URL')
  const webhookSecret = Deno.env.get('TELEGRAM_WEBHOOK_SECRET')

  if (!botToken || !adminChatId) {
    console.error('[TelegramBot] Missing required environment variables')
    return new Response('Service unavailable', { status: 503 })
  }

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*', // Will be restricted per deployment
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)

  // ── Internal endpoint: POST /functions/v1/telegram-bot/notify-order ──
  if (url.pathname.endsWith('/notify-order') && req.method === 'POST') {
    try {
      const order = await req.json()

      // Validate order data
      if (!order?.id || !order?.items || !Array.isArray(order.items)) {
        return new Response(JSON.stringify({ error: 'Invalid order data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Check rate limit
      if (!checkNotificationRateLimit(order.id)) {
        console.warn(`[NotifyOrder] Rate limit exceeded for order ${order.id}`)
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      await notifyAdminNewOrder(botToken, adminChatId, order)
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } catch (err) {
      console.error('[NotifyOrder] Error:', err)
      return new Response(JSON.stringify({ error: 'Notification failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  // ── Telegram webhook ──
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // Validate webhook secret if configured
  if (webhookSecret) {
    const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token')
    if (secretHeader !== webhookSecret) {
      console.warn('[TelegramBot] Invalid webhook secret')
      return new Response('Unauthorized', { status: 401 })
    }
  }

  let update: TelegramUpdate
  try {
    update = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── Handle /start command ──
  if (update.message?.text?.startsWith('/start')) {
    const chat = update.message.chat
    const firstName = escapeHtml(update.message.from?.first_name ?? 'Гость')
    const langCode = update.message.from?.language_code ?? 'ru'

    const MANAGER_USERNAME = 'wellsleepuz'
    const MANAGER_PHONE = '+998909583231'

    let greeting: string
    let btnCatalog: string
    let btnContact: string

    if (langCode.startsWith('uz')) {
      greeting = `✨ *Premium uyqu dunyosiga xush kelibsiz!* ✨\n\nHurmatli *${firstName}*, sizni qabul qilishdan mamnunmiz. Matras fabrikasi har qanday so'rovingizni amalga oshirishga tayyor:\n• 📐 *Bepul o'lchov* — mutaxassisimiz qulay vaqtda keladi.\n• ⚡️ *2 kunda tayyorlash* — o'z zamonaviy ishlab chiqarishimizda.\n• 🛏 *Har qanday o'lcham va to'ldirish* — klassikadan ortopedik premiumgacha.\n\n---\n\n💼 *Bevosita muloqot uchun kontaktlar:*\n📞 *Telefon:* ${MANAGER_PHONE}\n💬 *Menejer Telegram:* [Menejarga yozish](https://t.me/${MANAGER_USERNAME})\n\nInteraktiv 3D katalogimizni ochish va bir necha bosish bilan o'zingizga mos matrasni sozlash uchun quyidagi tugmani bosing! 👇`
      btnCatalog = '🛍 3D Katalogni ochish'
      btnContact = '📞 O\'lchov ustasi bilan bog\'lanish'
    } else if (langCode.startsWith('en')) {
      greeting = `✨ *Welcome to the world of premium sleep!* ✨\n\nDear *${firstName}*, we are glad to welcome you. Our mattress factory is ready to fulfill any of your requests:\n• 📐 *Free measurement* — our specialist will come at a convenient time.\n• ⚡️ *2-day production* — at our own high-tech facility.\n• 🛏 *Any size and filling* — from classic to orthopedic premium.\n\n---\n\n💼 *Our contacts for direct communication:*\n📞 *Phone:* ${MANAGER_PHONE}\n💬 *Manager on Telegram:* [Write to manager](https://t.me/${MANAGER_USERNAME})\n\nTap the button below to open our interactive 3D catalog and configure your mattress in a few clicks! 👇`
      btnCatalog = '🛍 Open 3D Catalog (Mini App)'
      btnContact = '📞 Contact measurement specialist'
    } else if (langCode.startsWith('kk') || langCode.startsWith('kz')) {
      greeting = `✨ *Премиум ұйқы әлеміне қош келдіңіз!* ✨\n\nҚұрметті *${firstName}*, сізді қабылдауға қуаныштымыз. Матрас фабрикасы кез келген сұрауыңызды орындауға дайын:\n• 📐 *Тегін өлшеу* — маманымыз ыңғайлы уақытта келеді.\n• ⚡️ *2 күнде дайындау* — өз заманауи өндірісімізде.\n• 🛏 *Кез келген өлшем* — классикадан ортопедиялық премиумға дейін.\n\n---\n\n💼 *Тікелей байланыс контактілері:*\n📞 *Телефон:* ${MANAGER_PHONE}\n💬 *Менеджер Telegram:* [Менеджерге жазу](https://t.me/${MANAGER_USERNAME})\n\nИнтерактивті 3D каталогымызды ашу үшін төмендегі түймені басыңыз! 👇`
      btnCatalog = '🛍 3D Каталогты ашу (Mini App)'
      btnContact = '📞 Өлшеуші маманмен байланысу'
    } else {
      greeting = `✨ *Добро пожаловать в мир премиального сна!* ✨\n\nУважаемый *${firstName}*, мы рады приветствовать вас. Фабрика матрасов готова воплотить в жизнь любой ваш запрос:\n• 📐 *Бесплатный замер* — наш специалист приедет в удобное время.\n• ⚡️ *Изготовление за 2 дня* — на собственном технологичном производстве.\n• 🛏 *Любые размеры и наполнение* — от классики до ортопедического премиума.\n\n---\n\n💼 *Наши контакты для прямой связи:*\n📞 *Телефон:* ${MANAGER_PHONE}\n💬 *Менеджер в Telegram:* [Написать менеджеру](https://t.me/${MANAGER_USERNAME})\n\nНажмите на кнопку ниже, чтобы открыть наш интерактивный 3D-каталог и настроить матрас под себя за пару кликов! 👇`
      btnCatalog = '🛍 Открыть 3D Каталог (Mini App)'
      btnContact = '📞 Связаться с замерщиком'
    }

    await sendMessage(
      botToken,
      chat.id,
      greeting,
      miniAppUrl
        ? {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: btnCatalog,
                    web_app: { url: miniAppUrl },
                  },
                ],
                [
                  {
                    text: btnContact,
                    url: `https://t.me/${MANAGER_USERNAME}`,
                  },
                ],
              ],
            },
          }
        : { parse_mode: 'Markdown' },
    )
    return new Response('ok')
  }

  // ── Handle admin inline button callbacks (confirm/cancel order) ──
  if (update.callback_query) {
    const { id: cbId, data, from } = update.callback_query
    const _ = from // admin user info available if needed

    if (data?.startsWith('confirm_order:') || data?.startsWith('cancel_order:')) {
      const [action, orderId] = data.split(':')
      const newStatus = action === 'confirm_order' ? 'confirmed' : 'cancelled'

      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      await answerCallbackQuery(
        botToken,
        cbId,
        newStatus === 'confirmed' ? '✅ Заказ подтверждён' : '❌ Заказ отменён',
      )

      // Edit the admin message to remove buttons
      if (update.callback_query.message) {
        await fetch(`${TELEGRAM_API}/bot${botToken}/editMessageReplyMarkup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: update.callback_query.message.chat.id,
            message_id: update.callback_query.message.message_id,
            reply_markup: { inline_keyboard: [] },
          }),
        })
      }
    }

    return new Response('ok')
  }

  return new Response('ok')
})
