# 📋 WellSleep Matras — Project Context

**Project:** Telegram Mini App for mattress sales (WellSleep)  
**Bot:** @wellsleepuz  
**Frontend:** https://matras-iota.vercel.app  
**GitHub:** https://github.com/umarmax/matras (public)  
**Status:** ✅ Production — Fully Deployed  
**Last Updated:** 2026-07-01

---

## 🎯 Project Overview

A premium Telegram Mini App for selling mattresses with:
- 3D product visualization (React Three Fiber)
- Motion animations (Framer Motion)
- Telegram-native UI (adapts to light/dark theme)
- Full e-commerce flow: catalog → cart → checkout
- Admin order notifications via Telegram Bot API
- Supabase backend (PostgreSQL + Edge Functions + RLS)
- **Multilanguage:** UZ 🇺🇿 / RU 🇷🇺 / EN 🇬🇧 / KZ 🇰🇿
- **Currency converter:** UZS / RUB / USD / EUR
- **Theme:** Light / Dark / Auto

**Tech Stack:**
- Frontend: React 19, TypeScript 6, Vite 8, Tailwind CSS v4, Framer Motion, @twa-dev/sdk
- Backend: Supabase (PostgreSQL, Edge Functions on Deno)
- State: Zustand with localStorage persistence
- 3D: React Three Fiber, Three.js, @react-three/drei (lazy-loaded)

---

## 🏗 Infrastructure

| Service | Details |
|---------|---------|
| **Frontend** | Vercel — https://matras-iota.vercel.app |
| **Database** | Supabase — iniesolotqxbzpchaezx.supabase.co |
| **Bot** | @wellsleepuz (token: 8362158298:AAEmG3...) |
| **GitHub** | https://github.com/umarmax/matras (public, auto-deploys to Vercel) |
| **Admin Chat ID** | 8627067211 |
| **Contact Phone** | +998 90 958 32 31 |
| **Contact Telegram** | @wellsleepuz |

---

## 📁 Key Files Reference

### Frontend
| File | Purpose |
|------|---------|
| `src/main.tsx` | Entry point, inits Telegram SDK, ErrorBoundary |
| `src/App.tsx` | Router + ThemeManager + AuthInit |
| `src/lib/i18n.ts` | Translations: UZ/RU/EN/KZ |
| `src/lib/telegram.ts` | Telegram SDK init + theme sync (safe try/catch) |
| `src/lib/auth.ts` | Auth via WebApp.initDataUnsafe + telegram-auth Edge Function |
| `src/lib/supabase.ts` | Supabase client + API functions |
| `src/store/settingsStore.ts` | Language, theme, currency settings (persisted) |
| `src/store/authStore.ts` | Auth state (initialized on app start) |
| `src/store/cartStore.ts` | Cart state (Zustand + localStorage) |
| `src/pages/HomePage.tsx` | Home + language picker + contact button popup |
| `src/pages/CatalogPage.tsx` | Product catalog with category filter |
| `src/pages/ProductPage.tsx` | Product detail with 3D + size picker |
| `src/pages/CartPage.tsx` | Cart with visible checkout button |
| `src/pages/OrderFormPage.tsx` | Checkout form (name, phone, address, comment) |
| `src/pages/ProfilePage.tsx` | Phone login to see orders + settings |
| `src/pages/SettingsPage.tsx` | Language / Theme / Currency settings |
| `src/components/Layout.tsx` | Bottom nav with icons + i18n labels |
| `src/components/ErrorBoundary.tsx` | Catches React crashes gracefully (multilingual) |
| `src/components/Mattress3DLazy.tsx` | 3D canvas with WebGL fallback |
| `vite.config.ts` | Manual chunk splitting for optimized bundles |

### Backend (Supabase)
| File | Purpose |
|------|---------|
| `supabase/schema.sql` | DB schema (products, profiles, orders) |
| `supabase/seed.sql` | 5 test products |
| `supabase/policies-fix.sql` | RLS policies |
| `supabase/functions/telegram-auth/index.ts` | HMAC validation (24h expiry), profile upsert |
| `supabase/functions/telegram-bot/index.ts` | Bot webhook + premium multilingual /start + admin notifications |
| `supabase/functions/create-order/index.ts` | Secure order creation with server-side price validation |

---

## 🌍 Features

### Multilanguage (i18n)
- **UZ** 🇺🇿 O'zbek (default)
- **RU** 🇷🇺 Русский
- **EN** 🇬🇧 English
- **KZ** 🇰🇿 Қазақша
- Language picker: top-right of home page (dropdown)
- Also in Settings page

### Currency Converter
- **UZS** so'm (default)
- **RUB** ₽
- **USD** $
- **EUR** €
- All prices converted in real-time

### Theme
- **Light** ☀️
- **Dark** 🌙
- **Auto** 🔄 (follows Telegram)

### Contact Button (Home Page)
- "Связаться с нами" button at bottom of home page (no emoji)
- Tapping opens bottom sheet popup with:
  - 📞 Phone button → calls +998 90 958 32 31 via `WebApp.openLink('tel:...')`
  - ✈️ Telegram button → opens @wellsleepuz

### Profile Page
- Phone login: enter phone number → see orders linked to that phone
- Settings button → goes to SettingsPage
- No user card (removed)

### Bot Greeting (/start)
- Premium multilingual welcome message
- Detects user's Telegram language (uz/ru/en/kk)
- Two buttons:
  - `🛍 Открыть 3D Каталог (Mini App)` → opens Mini App
  - `📞 Связаться с замерщиком` → opens @wellsleepuz

---

## 🔒 Security

- Server-side price validation (create-order Edge Function)
- Input sanitization (XSS protection)
- Rate limiting (5 orders/hour per user)
- Phone validation
- 24h auth_date expiry (was 1h)
- **JWT verification disabled** on telegram-bot function (required for Telegram webhooks)

### Supabase Secrets Set
- `TELEGRAM_BOT_TOKEN` ✅
- `TELEGRAM_ADMIN_CHAT_ID` ✅ (8627067211)
- `MINI_APP_URL` ✅ (https://matras-iota.vercel.app)

### Vercel Env Vars Set
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅
- `VITE_TELEGRAM_BOT_USERNAME` ✅ (wellsleepuz)

---

## 🚀 Deployment

### Auto-deploy
- GitHub repo is **public** → Vercel auto-deploys on every `git push origin main`
- No manual CLI deployment needed

### Manual deploy (if needed)
```bash
# Frontend
vercel deploy --prod --token <token> --yes

# Edge Functions (via Supabase Dashboard or CLI)
supabase functions deploy telegram-bot --project-ref iniesolotqxbzpchaezx
supabase functions deploy telegram-auth --project-ref iniesolotqxbzpchaezx
supabase functions deploy create-order --project-ref iniesolotqxbzpchaezx
```

### Webhook Setup
```bash
# Set webhook (no secret token)
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://iniesolotqxbzpchaezx.supabase.co/functions/v1/telegram-bot"

# Check webhook status
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

**Important:** JWT verification must be **disabled** on the `telegram-bot` Edge Function in Supabase Dashboard for webhooks to work.

---

## 📱 App Flow

```
User opens @wellsleepuz
  → /start → Premium welcome message (multilingual)
  → "🛍 Открыть 3D Каталог" button
  → Mini App opens at https://matras-iota.vercel.app
  → Auth via WebApp.initDataUnsafe (immediate) + telegram-auth Edge Function
  → Home page: language picker + hero + categories + products + contact button
  → Browse catalog → Product page (3D) → Add to cart
  → Cart → "Buyurtma berish" button → Order form
  → Fill name/phone/address → Submit
  → Admin gets Telegram notification with confirm/cancel buttons
  → User redirected to Profile → sees order
```

---

## 📦 Bundle Optimization

Manual chunk splitting in `vite.config.ts`:
- `react-vendor` — React + ReactDOM
- `ui-vendor` — React Router + Framer Motion
- `three-vendor` — Three.js core
- `r3f-vendor` — React Three Fiber + Drei (lazy-loaded)

Main bundle reduced from **680KB → 322KB** (gzip: 198KB → 84KB)

---

## 🐛 Known Issues / Notes

1. **TypeScript errors in Edge Functions** — Expected (Deno environment, not Node). Functions deploy fine.
2. **3D Model** — Procedural (no .gltf files). WebGL fallback shows 🛏 emoji if WebGL not supported.
3. **Payment** — Not integrated. Cash on delivery assumed.
4. **Profile name** — Shows from `WebApp.initDataUnsafe.user` (Telegram name). Falls back to "Guest" if opened outside Telegram.
5. **Orders in profile** — Fetched by phone number (after phone login) or by telegram_user_id.

---

## 📞 Contact Info

- **Phone:** +998 90 958 32 31
- **Telegram:** @wellsleepuz
- **Bot:** @wellsleepuz

---

## 🔄 How to Continue Development

```bash
# Run dev server
npm run dev

# Build
npm run build

# Deploy to Vercel (auto via git push, or manual)
git add -A && git commit -m "feat: ..." && git push origin main

# Deploy Edge Function (via Supabase Dashboard recommended)
# Or via CLI with personal access token from supabase.com/dashboard/account/tokens
```

---

*Last updated: 2026-07-01 by AI agent. All features deployed and working.*
