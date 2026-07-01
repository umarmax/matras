# WellSleep Matras — Project Handover

## Project Overview
Telegram Mini App for a mattress factory (WellSleep) in Uzbekistan. Users can browse a 3D catalog, configure mattress sizes, add to cart, and place orders. Admins receive order notifications via Telegram bot.

**Live URL:** https://matras-iota.vercel.app  
**GitHub:** https://github.com/umarmax/matras  
**Bot Username:** @wellsleepuz

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| 3D | React Three Fiber + Drei (lazy-loaded) |
| State | Zustand (persisted to localStorage) |
| Routing | React Router v7 |
| Backend | Supabase (Postgres + Edge Functions) |
| Hosting | Vercel (auto-deploy from GitHub main branch) |
| Bot | Supabase Edge Function (`telegram-bot`) |

---

## Key Files & Structure

```
src/
├── App.tsx              # Router setup
├── main.tsx             # Entry point, Telegram SDK init
├── lib/
│   ├── telegram.ts      # WebApp SDK wrapper
│   ├── supabase.ts      # Supabase client
│   ├── i18n.ts          # Translations (uz/ru/en/kz)
│   └── auth.ts          # Telegram auth helpers
├── store/
│   ├── appStore.ts      # Products, categories
│   ├── cartStore.ts     # Cart state (persisted)
│   ├── settingsStore.ts # Language, currency (persisted)
│   └── authStore.ts     # User auth state
├── pages/
│   ├── HomePage.tsx     # Hero, categories, contact button
│   ├── CatalogPage.tsx  # Product grid with filters
│   ├── ProductPage.tsx  # 3D viewer, size picker
│   ├── CartPage.tsx     # Cart items
│   ├── OrderFormPage.tsx# Checkout form
│   └── ProfilePage.tsx  # Order history
├── components/
│   ├── Mattress3DLazy.tsx  # Lazy-loaded 3D component
│   ├── Layout.tsx          # Bottom nav, safe areas
│   └── ...
└── data/
    └── products.ts      # Fallback static product data

supabase/
├── schema.sql           # Database schema
├── seed.sql             # Sample data
└── functions/
    ├── telegram-bot/    # Webhook handler + /start + admin notifications
    ├── telegram-auth/   # initData validation
    └── create-order/    # Order creation endpoint
```

---

## Environment Variables

### Vercel (Frontend)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Supabase Edge Functions
```
TELEGRAM_BOT_TOKEN=8362158298:AAEmG3WjGkslBvXfpMWrqLUvpvzm30TA1Dc
TELEGRAM_ADMIN_CHAT_ID=<your_chat_id>
MINI_APP_URL=https://matras-iota.vercel.app
TELEGRAM_WEBHOOK_SECRET=<random_string>  # optional but recommended
```

---

## Telegram Bot Webhook Setup

**Current Status:** Webhook is set but returning `401 Unauthorized` — the `TELEGRAM_WEBHOOK_SECRET` env var needs to be set in Supabase or the webhook needs to be re-registered without a secret.

### Commands:

1. **Check webhook status:**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

2. **Set webhook (with secret):**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://iniesolotqxbzpchaezx.supabase.co/functions/v1/telegram-bot",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

3. **Set webhook (without secret — simpler):**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://iniesolotqxbzpchaezx.supabase.co/functions/v1/telegram-bot"}'
```

4. **Delete webhook (if needed):**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

---

## Bot Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `/start` | `telegram-bot/index.ts` | Sends welcome message with Mini App button |
| Callback: `confirm_order:<id>` | Same file | Admin confirms order |
| Callback: `cancel_order:<id>` | Same file | Admin cancels order |

---

## i18n (Internationalization)

Languages supported: **Uzbek (uz)**, **Russian (ru)**, **English (en)**, **Kazakh (kz)**

All translations in `src/lib/i18n.ts`. Usage:
```tsx
import { t } from '../lib/i18n'
const lang = useSettingsStore((s) => s.language)
// ...
<span>{t(lang, 'add_to_cart')}</span>
```

---

## Recent Changes (July 2026)

1. **Bundle optimization** — Manual chunks in `vite.config.ts`:
   - Main bundle: 680KB → 322KB
   - 3D libs lazy-loaded separately

2. **i18n fixes** — Removed hardcoded Russian strings from:
   - CartPage, OrderFormPage, ProductPage, ErrorBoundary

3. **Phone format** — Display: `+998 90 958 32 31`, tel: link: `+998909583231`

4. **Contact button** — Removed phone emoji from "Contact Us" button

---

## Pending Tasks

- [ ] **Bot /start message** — User will provide custom message text
- [ ] **Fix webhook 401** — Set `TELEGRAM_WEBHOOK_SECRET` in Supabase or re-register without secret

---

## Deployment

**Frontend:** Push to `main` branch → Vercel auto-deploys

**Edge Functions:** 
```bash
supabase functions deploy telegram-bot
supabase functions deploy telegram-auth
supabase functions deploy create-order
```

---

## Contact

- **Manager Telegram:** @wellsleepuz
- **Phone:** +998 90 958 32 31
