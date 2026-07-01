# WellSleep Matras — Project Handover

## Project Overview
Telegram Mini App for a mattress factory (WellSleep) in Uzbekistan. Users can browse a 3D catalog, configure mattress sizes, add to cart, and place orders. Admins receive order notifications via Telegram bot.

**Live URL:** https://matras-iota.vercel.app  
**GitHub:** https://github.com/umarmax/matras  
**Bot Username:** @wellsleepuz  
**Status:** ✅ Production — Fully Working

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
│   ├── ErrorBoundary.tsx   # Multilingual error handling
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
VITE_SUPABASE_URL=https://iniesolotqxbzpchaezx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TELEGRAM_BOT_USERNAME=wellsleepuz
```

### Supabase Edge Functions
```
TELEGRAM_BOT_TOKEN=8362158298:AAEmG3WjGkslBvXfpMWrqLUvpvzm30TA1Dc
TELEGRAM_ADMIN_CHAT_ID=8627067211
MINI_APP_URL=https://matras-iota.vercel.app
```

---

## Telegram Bot Webhook Setup

**Current Status:** ✅ Working

**Important:** JWT verification must be **DISABLED** on the `telegram-bot` Edge Function in Supabase Dashboard for webhooks to work (Telegram doesn't send JWT tokens).

### Commands:

1. **Check webhook status:**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

2. **Set webhook (no secret token):**
```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://iniesolotqxbzpchaezx.supabase.co/functions/v1/telegram-bot"
```

3. **Delete webhook (if needed):**
```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/deleteWebhook"
```

---

## Bot Commands

| Command | Handler | Description |
|---------|---------|-------------|
| `/start` | `telegram-bot/index.ts` | Sends multilingual welcome message with Mini App button |
| Callback: `confirm_order:<id>` | Same file | Admin confirms order |
| Callback: `cancel_order:<id>` | Same file | Admin cancels order |

### /start Message
- Auto-detects user's Telegram language (uz/ru/en/kk)
- Shows premium welcome message with contact info
- Two inline buttons:
  - "🛍 Open 3D Catalog" → opens Mini App
  - "📞 Contact specialist" → opens @wellsleepuz

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

## Bundle Optimization

Manual chunk splitting in `vite.config.ts`:
- `react-vendor` — React + ReactDOM
- `ui-vendor` — React Router + Framer Motion
- `three-vendor` — Three.js core
- `r3f-vendor` — React Three Fiber + Drei (lazy-loaded)

**Result:** Main bundle reduced from **680KB → 322KB** (gzip: 198KB → 84KB)

---

## Recent Changes (July 2026)

1. **Bundle optimization** — Manual chunks in `vite.config.ts`
2. **i18n fixes** — Removed hardcoded Russian strings from CartPage, OrderFormPage, ProductPage, ErrorBoundary
3. **Phone format** — Display: `+998 90 958 32 31`, tel: link: `+998909583231`
4. **Contact button** — Removed phone emoji from "Contact Us" button
5. **Webhook fix** — Disabled JWT verification, re-registered webhook without secret token
6. **Bot username** — Changed from @wellsleep_uzbot to @wellsleepuz

---

## Deployment

**Frontend:** Push to `main` branch → Vercel auto-deploys

**Edge Functions:** Deploy via Supabase Dashboard (recommended) or CLI:
```bash
supabase functions deploy telegram-bot
supabase functions deploy telegram-auth
supabase functions deploy create-order
```

**After deploying Edge Functions:** Make sure JWT verification is **disabled** on `telegram-bot` function.

---

## Troubleshooting

### Bot not responding to /start
1. Check webhook: `curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"`
2. If `last_error_message` shows "401 Unauthorized" → Disable JWT verification in Supabase Dashboard
3. Re-register webhook if needed

### 3D not loading
- WebGL might not be supported → Falls back to 🛏 emoji
- Check browser console for errors

### Orders not appearing in admin chat
- Verify `TELEGRAM_ADMIN_CHAT_ID` is set correctly in Supabase secrets
- Check Edge Function logs in Supabase Dashboard

---

## Contact

- **Manager Telegram:** @wellsleepuz
- **Phone:** +998 90 958 32 31
- **Admin Chat ID:** 8627067211

---

*Last updated: 2026-07-01*
