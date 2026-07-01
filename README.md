# 🛏 Matras — Telegram Mini App для продажи матрасов

Премиальный Telegram Mini App с 3D-визуализацией, плавными motion-анимациями и интеграцией с Telegram Bot API.

## ✨ Особенности

- 🎨 **Премиальный UI** — Tailwind CSS v4 + Framer Motion
- 🛏 **3D-модели** — React Three Fiber (process-based mattress rendering)
- 📱 **Telegram-native** — полная интеграция с @twa-dev/sdk
- 🔐 **Безопасность** — HMAC-SHA256 валидация initData
- ☁️ **Backend** — Supabase (PostgreSQL + Edge Functions + RLS)
- 📦 **Состояние** — Zustand с localStorage-персистентностью
- 🤖 **Bot API** — автоматические уведомления админу о заказах

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
cd c:/Users/Windows 10/Desktop/matras
npm install
```

#### ⚠️ Для Windows PowerShell — исправление ошибки "running scripts is disabled"

Если при `npm run dev` получаете ошибку:
```
npm : File C:\...\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

**Решение:**
```powershell
# Запустите PowerShell от имени администратора и выполните:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Или для одной сессии:
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
```

После этого `npm run dev` заработает.

---

### 2. Настройка Supabase

#### 2.1. Создайте проект на [supabase.com](https://supabase.com)

#### 2.2. Создайте таблицы

Откройте **SQL Editor** в Dashboard и выполните:

```bash
# Основная схема
supabase/schema.sql
```

#### 2.3. Добавьте тестовые товары

```bash
supabase/seed.sql
```

#### 2.4. Если таблица `orders` уже существовала — примените миграцию

```sql
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists comment text;
```

#### 2.5. Исправьте RLS-политики для заказов

```bash
supabase/policies-fix.sql
```

---

### 3. Настройка Telegram Bot

#### 3.1. Создайте бота

1. Найдите [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot`
3. Выберите имя (например: **Matras Shop**)
4. Выберите username (например: `matras_shop_bot`)
5. Сохраните **токен** (формат: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

#### 3.2. Получите свой Chat ID

1. Найдите [@userinfobot](https://t.me/userinfobot)
2. Отправьте любое сообщение
3. Запишите **ваш ID** (например: `123456789`)

#### 3.3. Настройте `.env`

```bash
cp .env.example .env
```

Отредактируйте `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_TELEGRAM_BOT_USERNAME=matras_shop_bot
```

---

### 4. Деплой Edge Functions

#### 4.1. Установите Supabase CLI

```bash
npm install -g supabase
supabase login
```

#### 4.2. Свяжите с проектом

```bash
supabase link --project-ref your-project-ref
```

#### 4.3. Задеплойте функции

```bash
supabase functions deploy telegram-auth
supabase functions deploy telegram-bot
```

#### 4.4. Добавьте секреты в Supabase Dashboard

Перейдите: **Settings → Edge Functions → Secrets**

Добавьте:
```
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_ADMIN_CHAT_ID=123456789
MINI_APP_URL=https://your-app.vercel.app
```

> **Примечание:** `MINI_APP_URL` заполните после деплоя фронтенда (шаг 5)

---

### 5. Деплой фронтенда

#### Вариант А: Vercel (рекомендуется)

```bash
npm install -g vercel
vercel
```

После деплоя получите URL вида `https://matras-xyz.vercel.app`

#### Вариант Б: Cloudflare Pages / Netlify

Подключите репозиторий через UI:
- Build command: `npm run build`
- Output directory: `dist`

---

### 6. Настройка webhook Telegram Bot

После деплоя фронтенда выполните:

```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://<YOUR_SUPABASE_PROJECT>.supabase.co/functions/v1/telegram-bot"}'
```

Замените:
- `<YOUR_BOT_TOKEN>` → ваш токен из BotFather
- `<YOUR_SUPABASE_PROJECT>` → ваш Supabase project ref

Проверьте статус:
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

---

### 7. Настройка Mini App в BotFather

1. Отправьте `/newapp` в [@BotFather](https://t.me/BotFather)
2. Выберите вашего бота
3. Укажите название (например: **Каталог Matras**)
4. Загрузите иконку 640×360 (можно сгенерировать в DALL-E/Midjourney)
5. Укажите **Web App URL**: `https://your-app.vercel.app`
6. Короткое описание: `Матрасы на заказ за 2 дня`

Теперь команда `/start` в боте покажет кнопку **"Открыть каталог"** с вашим Mini App!

---

### 8. Обновите переменную окружения `MINI_APP_URL`

В **Supabase Dashboard → Settings → Edge Functions → Secrets** обновите:

```
MINI_APP_URL=https://your-app.vercel.app
```

И **редеплойте** telegram-bot функцию:

```bash
supabase functions deploy telegram-bot
```

---

## 🛠 Разработка

### Запуск dev-сервера

```bash
npm run dev
```

Откроется на `http://localhost:5173`

> **Для тестирования в Telegram:** используйте [ngrok](https://ngrok.com) или [localtunnel](https://localtunnel.github.io/www/)

```bash
npx localtunnel --port 5173
```

Затем укажите полученный URL в BotFather как временный Web App URL.

---

### Структура проекта

```
matras/
├── src/
│   ├── components/       # UI-компоненты
│   │   ├── Mattress3D.tsx              # 3D-модель матраса (R3F)
│   │   ├── Mattress3DLazy.tsx          # Lazy-load wrapper
│   │   └── TelegramMainButtonSync.tsx  # Sync с MainButton TG
│   ├── pages/            # Страницы
│   │   ├── HomePage.tsx
│   │   ├── CatalogPage.tsx
│   │   ├── ProductPage.tsx
│   │   ├── CartPage.tsx
│   │   ├── OrderFormPage.tsx           # ← форма оформления заказа
│   │   └── ProfilePage.tsx
│   ├── store/            # Zustand stores
│   │   ├── appStore.ts   # products state
│   │   ├── cartStore.ts  # корзина (localStorage persist)
│   │   └── authStore.ts  # Telegram auth
│   ├── lib/
│   │   ├── telegram.ts   # @twa-dev/sdk init + theme
│   │   ├── supabase.ts   # Supabase client + API
│   │   └── auth.ts       # Telegram InitData auth
│   └── types/            # TypeScript типы
│
├── supabase/
│   ├── schema.sql        # Схема БД
│   ├── seed.sql          # Тестовые товары
│   ├── policies-fix.sql  # RLS-политики для заказов
│   └── functions/
│       ├── telegram-auth/  # Валидация initData HMAC
│       └── telegram-bot/   # Webhook + уведомления админу
│
└── public/
    ├── icons.svg         # SVG-спрайт
    └── favicon.svg
```

---

## 📊 Архитектура

### Фронтенд (Telegram Mini App)

```
User opens bot → /start → Bot sends inline button with web_app URL
                                    ↓
                          Mini App loads in Telegram WebView
                                    ↓
                          React app inits Telegram SDK
                                    ↓
                          Reads initData (user info, theme)
                                    ↓
                   Validates via telegram-auth Edge Function (HMAC)
                                    ↓
                          Loads products from Supabase
                                    ↓
                      User adds to cart → fills order form
                                    ↓
                        createOrder() → inserts to DB
                                    ↓
               Calls telegram-bot/notify-order → sends to admin
```

### Бэкенд (Supabase Edge Functions)

#### `telegram-auth`
- Валидирует Telegram initData через HMAC-SHA256
- Создаёт/обновляет профиль в `profiles`
- Возвращает пользователя фронтенду

#### `telegram-bot`
- **Webhook:** принимает обновления от Telegram
  - `/start` → приветствие + inline-кнопка с Mini App
  - Callback-кнопки → подтверждение/отмена заказа админом
- **Internal endpoint:** `/notify-order` (POST)
  - Вызывается из `OrderFormPage`
  - Отправляет уведомление админу через Bot API

---

## 🔐 Безопасность

1. **HMAC валидация** — все запросы от Telegram проверяются на подпись
2. **RLS (Row Level Security)** — пользователи видят только свои заказы
3. **Anon key** — публичный ключ для read-only + insert (create order)
4. **Service role key** — используется только в Edge Functions (server-side)

---

## 📦 Переменные окружения

### Фронтенд (`.env`)
```env
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_TELEGRAM_BOT_USERNAME=your_bot
```

### Бэкенд (Supabase Secrets)
```
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_ADMIN_CHAT_ID=123456789
MINI_APP_URL=https://your-app.vercel.app
```

---

## 🎨 Кастомизация

### Изменить цвета
Tailwind v4 использует CSS-переменные из Telegram:
```css
/* src/index.css */
--tg-theme-bg-color
--tg-theme-button-color
--tg-theme-text-color
```

### Добавить категории
Отредактируйте:
```typescript
// src/components/CategoryList.tsx
export const CATEGORIES: Category[] = [
  { id: '...', name: 'Новая категория', slug: 'new-cat', icon: '🎯', ... }
]
```

### Настроить 3D-модель
```typescript
// src/components/Mattress3D.tsx
<RoundedBox args={[width, thickness, height]} smoothness={4} ...>
```

---

## 🐛 Отладка

### Проблема: "Cannot read initData"
**Причина:** Приложение запущено вне Telegram  
**Решение:** Используйте Bot → `/start` → кнопка "Открыть каталог"

### Проблема: Edge Function возвращает 500
**Проверьте:**
1. Secrets заполнены (Dashboard → Edge Functions → Secrets)
2. Edge Function задеплоена (`supabase functions deploy`)
3. Логи: `supabase functions logs telegram-bot`

### Проблема: Заказ создаётся, но админ не получает уведомление
**Проверьте:**
1. Webhook установлен: `curl .../getWebhookInfo`
2. `TELEGRAM_ADMIN_CHAT_ID` корректный
3. `MINI_APP_URL` задан в Secrets
4. Редеплой после изменения Secrets: `supabase functions deploy telegram-bot`

---

## 📚 Ресурсы

- [Telegram Mini Apps Docs](https://core.telegram.org/bots/webapps)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)
- [Framer Motion](https://www.framer.com/motion/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

## 📝 Лицензия

MIT

---

## 🤝 Поддержка

Вопросы? Напишите в [@your_support_bot](https://t.me/your_support_bot)

---

**Сделано с ❤️ для продавцов матрасов**
