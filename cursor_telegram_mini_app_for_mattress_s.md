# Telegram Mini App for mattress sales
_Exported on 6/29/2026 at 19:37:47 GMT+5 from Cursor (3.9.16)_

---

**User**

Ты — Senior Full-Stack разработчик и UX/UI дизайнер, эксперт по созданию Telegram Mini Apps (TMA) и 3D Web интерфейсов. 🎨📱

Твоя задача: написать код для современного Telegram Mini App по продаже матрасов. Интерфейс должен быть премиальным, с плавными motion-анимациями и элементами 3D (используй framer-motion для UI-анимаций и подготовь заглушки на React Three Fiber / Spline для 3D-объектов). 🛌✨

УТП бизнеса (обязательно выделить визуально на главной странице):
Бесплатный замер. 📏
Изготовление за 2 дня. ⏱️
Все виды и размеры матрасов. 📏

Технический стек:
Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, @twa-dev/sdk (для Telegram Web Apps API), React Three Fiber (опционально для 3D). 🚀
Backend / База данных: Supabase (аутентификация через Telegram InitData, база товаров, заказы). ☁️
Состояние: Zustand. 📦

Требования к UI/UX:
Адаптация строго под мобильные устройства (TMA). Поддержка темной и светлой темы Telegram (через CSS переменные TG). Кнопки должны быть крупными, навигация интуитивной. Использовать Telegram MainButton для оформления заказа, когда корзина не пуста. 🌗📱

Реализуй проект пошагово на основе моего To-Do листа. Не пиши весь код сразу. Сейчас мы выполняем Этап 3 (Frontend) и Этап 4 (Интеграция с Supabase). 🛠️

Выдай структуру директорий и напиши код для первых трех пунктов:
Каркас приложения, настройка Tailwind и подключение Telegram SDK. 🏗️
Главная страница: Hero-секция с 3D-заглушкой матраса (или красивой motion-анимацией), баннеры "Бесплатный замер" и "Изготовление 2 дня", список категорий. 🛏️
Логика интеграции с Supabase: создание клиента и fetch-запрос для получения списка товаров. 🔄

Жду структуру проекта и код первых файлов. После этого я дам команду продолжать. 🚀
Напиши изолированный React-компонент Mattress3D.tsx с использованием @react-three/fiber и @react-three/drei. 

Этот компонент будет отображать 3D-модель матраса, сгенерированную процедурно (без использования внешних .gltf или .obj файлов, только базовые меши Three.js).

Требования к модели:
Форма: Скругленная коробка (BoxGeometry со скруглением или кастомный меш), напоминающая матрас. Размеры должны динамически меняться через пропсы (width, height, thickness).
Текстура/Материал: Белый или слегка кремовый премиальный материал. Сделай легкий рельеф (bumpMap или нормали), имитирующий стеганую ткань матраса, используя процедурную текстуру (например, сетку).
Интерактив и Анимация: 
Матрас должен плавно вращаться по оси Y (авто-ротация).
Реализуй реакцию на проп rigidity (жесткость): если жесткость "мягкий", при клике на матрас он должен слегка проминаться (scale по оси Y уменьшается с эффектом spring-анимации).
Оптимизация для Telegram Mini App: Минимум полигонов, базовое, но красивое освещение (ambientLight + directionalLight с мягкими тенями).

Компонент должен быть полностью готов к импорту в форму заказа или карточку товара.

---

**Cursor**

Сначала посмотрю, что уже есть в проекте, и соберу каркас приложения с Tailwind, Telegram SDK и компонентом Mattress3D.


Проект пустой — создаю структуру с нуля: инициализирую Vite-проект и добавлю необходимые файлы.


Создаю структуру проекта и все необходимые файлы.


Готово: каркас TMA, главная страница, Supabase-клиент и изолированный `Mattress3D.tsx`. Сборка проходит успешно.

## Структура проекта

```
matras/
├── index.html                 # viewport + Telegram Web App script
├── vite.config.ts             # Vite + Tailwind v4
├── .env.example               # Supabase keys
├── package.json
└── src/
    ├── main.tsx               # init Telegram SDK + mount
    ├── App.tsx
    ├── index.css              # Tailwind + TG CSS variables
    ├── vite-env.d.ts
    ├── types/
    │   └── index.ts           # Product, Category, Rigidity
    ├── lib/
    │   ├── telegram.ts        # @twa-dev/sdk init + theme
    │   └── supabase.ts        # client + fetchProducts()
    ├── store/
    │   └── appStore.ts        # Zustand: products state
    ├── components/
    │   ├── Mattress3D.tsx     # 3D матрас (R3F + drei)
    │   ├── HeroSection.tsx    # Hero + 3D
    │   ├── USPBanners.tsx     # УТП-баннеры
    │   ├── CategoryList.tsx   # Категории
    │   └── Layout.tsx         # Mobile shell + bottom nav
    └── pages/
        └── HomePage.tsx       # Главная страница
```

---

## Этап 1 — Каркас, Tailwind, Telegram SDK

**Tailwind v4** подключён через `@tailwindcss/vite` в `vite.config.ts`.

**Telegram-тема** — CSS-переменные `--tg-theme-*` синхронизируются с `WebApp.themeParams` и обновляются при `themeChanged`:

```1:36:c:\Users\Windows 10\Desktop\matras\src\lib\telegram.ts
import WebApp from '@twa-dev/sdk'

const THEME_VARS: Record<string, keyof typeof WebApp.themeParams> = {
  '--tg-theme-bg-color': 'bg_color',
  // ...
}

export function initTelegramApp() {
  WebApp.ready()
  WebApp.expand()
  applyTelegramTheme()
  WebApp.onEvent('themeChanged', applyTelegramTheme)
  return WebApp
}
```

---

## Этап 2 — Главная страница

| Блок | Компонент | Что делает |
|------|-----------|------------|
| Hero + 3D | `HeroSection` | Заголовок, motion-анимации, `Mattress3D` |
| УТП | `USPBanners` | «Бесплатный замер», «2 дня», «Все размеры» |
| Категории | `CategoryList` | 5 карточек с tap-анимацией |
| Товары | `ProductsPreview` | Горизонтальный скролл из Supabase |

---

## Этап 3 — Supabase

```1:44:c:\Users\Windows 10\Desktop\matras\src\lib\supabase.ts
export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
)

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  // ...
}
```

Zustand-store загружает товары на главной через `loadProducts()`.

---

## `Mattress3D.tsx` — ключевые возможности

```typescript
<Mattress3D
  width={2}          // ширина (X)
  height={2.2}       // длина (Z)
  thickness={0.35}   // высота (Y)
  rigidity="soft"    // при клике — проминание
  autoRotate         // авто-вращение по Y
/>
```

| Требование | Реализация |
|------------|------------|
| Форма | `RoundedBox` (drei), `smoothness: 4` |
| Материал | Кремовый `meshStandardMaterial` + процедурная стёжка (Canvas → `map` + `bumpMap`) |
| Авто-ротация | `useFrame` → `rotation.y += delta * 0.35` |
| Жёсткость `soft` | Клик → `scale.y` 0.88 с spring-интерполяцией |
| Оптимизация TMA | `dpr={[1, 1.5]}`, shadow map 512px, `powerPreference: 'low-power'` |

---

## Запуск

```bash
cd "c:\Users\Windows 10\Desktop\matras"
cp .env.example .env   # добавьте Supabase URL и anon key
npm run dev
```

Без `.env` приложение работает: каталог покажет заглушку «временно недоступен», остальной UI — полностью.

---

## Следующие шаги (когда скажете «продолжай»)

1. Каталог и карточка товара с `Mattress3D` по `rigidity`
2. Корзина + Telegram `MainButton`
3. Auth через Telegram InitData + Supabase
4. Code-splitting для Three.js (сейчас бандл ~1.4 MB)

Напишите **«продолжай»** — перейдём к следующему этапу To-Do.

---

**User**

продолжай

---

**Cursor**

Продолжаю: изучаю текущий код и реализую каталог, карточку товара, корзину с MainButton и аутентификацию через Telegram.


Этап продолжен: добавлены навигация, каталог, карточка товара, корзина, профиль, Telegram MainButton и auth через InitData. Сборка проходит успешно.

## Что добавлено

### Маршруты (`react-router-dom`)

| Путь | Страница |
|------|----------|
| `/` | Главная |
| `/catalog` | Каталог (+ фильтр `?category=`) |
| `/catalog/:categorySlug` | Каталог по категории |
| `/product/:id` | Карточка товара с 3D |
| `/cart` | Корзина |
| `/profile` | Профиль + заказы |

### Новые файлы

```
src/
├── data/mockProducts.ts          # 5 демо-товаров (если Supabase недоступен)
├── store/
│   ├── cartStore.ts              # корзина (persist в localStorage)
│   └── authStore.ts              # Telegram auth
├── hooks/useTelegramBackButton.ts
├── components/
│   ├── Mattress3DLazy.tsx        # lazy-load 3D (отдельный chunk)
│   ├── ProductCard.tsx
│   ├── SizePicker.tsx
│   ├── RigidityBadge.tsx
│   └── TelegramMainButtonSync.tsx
└── pages/
    ├── CatalogPage.tsx
    ├── ProductPage.tsx
    ├── CartPage.tsx
    └── ProfilePage.tsx

supabase/
├── schema.sql                    # products, profiles, orders + RLS
└── functions/telegram-auth/      # Edge Function-заглушка
```

### Ключевые фичи

**Каталог** — фильтры по категориям, сетка карточек, fallback на mock-данные.

**Карточка товара** — `Mattress3DLazy` с размерами из выбранных ширины/длины, `RigidityBadge`, выбор размеров, кнопка «В корзину».

**Корзина** — изменение количества, удаление, итог с «Бесплатный замер — 0 ₽».

**Telegram MainButton** — появляется, когда корзина не пуста; оформляет заказ через Supabase (или локально в dev).

**Auth** — `authenticateWithTelegram()` вызывает Edge Function `telegram-auth`; без Supabase — профиль из `WebApp.initDataUnsafe`.

**Code-splitting** — Three.js вынесен в отдельный chunk `Mattress3D-*.js` (~890 KB), основной бандл ~643 KB.

---

## Как проверить

```bash
npm run dev
```

Без `.env` приложение работает на **mock-товарах** — можно пройти весь flow: каталог → товар → корзина → оформление.

С Supabase:
1. Скопируйте `.env.example` → `.env`
2. Примените `supabase/schema.sql`
3. Задеплойте `supabase/functions/telegram-auth`

---

## Следующий этап (когда скажете «продолжай»)

1. Полная валидация Telegram InitData HMAC в Edge Function
2. Форма заказа с адресом и записью на бесплатный замер
3. Анимации переходов между страницами
4. Деплой TMA (Vercel / Cloudflare + BotFather)

Напишите **«продолжай»** — перейдём к следующему блоку.

---

**User**

dobavil env , и применил schema sql 


---

**Cursor**

Проверяю `.env` и подключение к Supabase, затем добавлю тестовые товары, если таблица пустая.


Подключение работает; таблица `products` пустая. Добавляю seed-данные и проверяю политики RLS для заказов.


Подключение к Supabase работает; таблица `products` пустая, а заказы блокирует RLS. Добавляю seed-данные, исправляю политики и защищаю `.env`.


Подключение к Supabase проверено — всё ок.

## Статус

| Проверка | Результат |
|----------|-----------|
| `.env` | URL и anon key читаются |
| Таблица `products` | Есть, но **0 товаров** |
| Оформление заказа | **RLS блокирует** insert в `orders` |

Схема применена верно, но каталог пуст, а заказы пока не сохраняются из‑за политик безопасности.

---

## Что сделать в Supabase SQL Editor

**1. Товары** — выполните `supabase/seed.sql`  
Добавит 5 моделей (Ortho Premium, Spring Classic и др.).

**2. Заказы** — выполните `supabase/policies-fix.sql`  
Разрешит создание заказов через anon-ключ из Mini App.

---

## После этого

Перезапустите dev-сервер (если был запущен):

```bash
npm run dev
```

На главной и в каталоге должны появиться товары из базы, а оформление заказа через Telegram MainButton — сохраняться в `orders`.

---

## Безопасность

`.env` добавлен в `.gitignore`, чтобы ключи не попали в git.

---

Когда выполните оба SQL-скрипта, напишите **«готово»** — проверю подключение ещё раз и перейдём к Edge Function `telegram-auth` или деплою TMA.

---

**User**

npm run ne rabotaet   running scripts is disabled on this system 
kogda budem podklyuchat bot api 
ui budet v telegram bot 


