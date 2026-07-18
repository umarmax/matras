# Upgrade: Dynamic Pricing + Hidden Admin Panel

This release replaces fixed per-product prices with **dynamic per-m² pricing by
category**, adds a **role-based Admin Panel** inside the Mini App, expands the
order-status pipeline, and removes Russian Rubles (UZS everywhere).

> ⚠️ **Order of operations matters.** Run the database migration **before**
> deploying the updated Edge Functions — the new `create-order` and `admin-api`
> functions read the new `categories` / `admins` tables.

---

## 1. Run the database migration (first!)

Supabase Dashboard → **SQL Editor** → paste and run:

```
supabase/migrations/0001_dynamic_pricing_and_admin.sql
```

It is safe on the existing production DB (idempotent, no data loss). It:
- creates `categories` (per-m² pricing) and seeds the 5 categories,
- creates `admins` and seeds the Owner (`telegram_user_id = 8627067211`),
- adds `products.category_id` (backfilled from the existing `category` slug),
- adds `orders.admin_note` and expands the status check constraint,
- adds indexes and RLS policies.

## 2. Deploy the Edge Functions

```bash
supabase functions deploy create-order   # now prices by category × area
supabase functions deploy admin-api       # NEW — secure admin backend
supabase functions deploy telegram-bot    # currency fix (UZS, was ₽)
```

**`admin-api` requires JWT verification ENABLED is fine** (it validates Telegram
initData itself). It needs these secrets (already set for the other functions):
`TELEGRAM_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Keep `telegram-bot` JWT verification **disabled** (webhook, unchanged).

## 3. Deploy the frontend

Push to `main` → Vercel auto-deploys. No new env vars required.

## 4. Set your prices

Open the Mini App as the Owner → **Profile → 🛠 Admin Panel → Categories**.
The seeded `price_per_m2` / `minimum_price` values are **placeholders** — set the
real UZS numbers. Changes take effect immediately, no redeploy.

---

## How pricing works

```
area_m² = (width_cm / 100) × (length_cm / 100)
price   = round(area_m² × category.price_per_m2)
price   = max(price, category.minimum_price)   # when a minimum is set
```

- Frontend: `src/lib/pricing.ts` (live display in Product/Cart).
- Backend: re-computed in `create-order` (authoritative — the client price is
  never trusted). Any size works with no code changes (standard/custom/future).

## Roles

| Role            | In `admins` table | Access |
|-----------------|-------------------|--------|
| **Owner**       | `role = 'owner'`  | Everything: prices, categories, images, orders, managers |
| **Sales Manager** | `role = 'sales_manager'` | Orders: view, change status, notes. **No** price/category/manager access |
| **Customer**    | *absent from table* | Normal Mini App only — never sees the panel exists |

Authorization is enforced **server-side** in `admin-api` (Telegram initData HMAC
+ role check). The frontend gate is only cosmetic.

### Adding a manager

Owner → Admin Panel → **Доступы (Managers)** → enter the person's Telegram user
id (they can get it from `@userinfobot`), pick a role, Add.

## Order statuses

`pending → confirmed → in_production → ready → delivered` (+ `cancelled`).
Legacy `completed` remains valid for old rows.

## Tests

```bash
npm test      # price calc, minimum price, custom sizes, UZS formatting
```
