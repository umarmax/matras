# 🚀 Matras Deployment Checklist

**⚠️ IMPORTANT: Security hardening completed on 2026-07-01**  
**All critical and high-priority security issues have been fixed.**  
**Follow this checklist carefully to maintain security in production.**

---

## Phase 1: Database Setup
- [ ] Execute `supabase/schema.sql` in Supabase SQL Editor
- [ ] Execute `supabase/seed.sql` to add test products
- [ ] If `orders` table exists, run migration:
  ```sql
  alter table public.orders add column if not exists customer_name text;
  alter table public.orders add column if not exists customer_phone text;
  alter table public.orders add column if not exists delivery_address text;
  alter table public.orders add column if not exists comment text;
  ```
- [ ] Execute `supabase/policies-fix.sql` for RLS policies

## Phase 2: Telegram Bot Setup
- [ ] Create bot via @BotFather (`/newbot`)
  - Save bot token: `123456:ABC-DEF...`
  - Save bot username: `your_bot_username`
- [ ] Get admin Chat ID from @userinfobot
- [ ] Copy `.env.example` to `.env`
- [ ] Fill `.env`:
  ```env
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key
  VITE_TELEGRAM_BOT_USERNAME=your_bot_username
  ```

## Phase 3: Supabase Edge Functions
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Login: `supabase login`
- [ ] Link project: `supabase link --project-ref your-ref`
- [ ] **Deploy all 3 functions** (including new secure order creation):
  ```bash
  supabase functions deploy telegram-auth
  supabase functions deploy telegram-bot
  supabase functions deploy create-order
  ```
- [ ] **Generate webhook secret** (for security):
  ```bash
  # Generate random secret (Linux/Mac)
  openssl rand -hex 32
  
  # Or use online generator: https://www.random.org/strings/
  ```
- [ ] Add secrets in Supabase Dashboard → Settings → Edge Functions → Secrets:
  - `TELEGRAM_BOT_TOKEN=123456:ABC-DEF...`
  - `TELEGRAM_ADMIN_CHAT_ID=123456789`
  - `MINI_APP_URL=` (leave empty for now, fill after frontend deploy)
  - `TELEGRAM_WEBHOOK_SECRET=your-generated-secret-here` ⭐ **NEW - REQUIRED FOR SECURITY**

## Phase 4: Frontend Deployment
- [ ] Deploy to Vercel:
  ```bash
  npm install -g vercel
  vercel
  ```
  OR deploy to Cloudflare Pages/Netlify via Git
- [ ] Copy deployed URL (e.g., `https://matras-xyz.vercel.app`)
- [ ] Update `MINI_APP_URL` secret in Supabase Edge Functions
- [ ] Redeploy functions with updated MINI_APP_URL:
  ```bash
  supabase functions deploy telegram-bot
  supabase functions deploy create-order
  ```

## Phase 5: Bot Configuration
- [ ] **Set webhook WITH secret token** (security improvement):
  ```bash
  curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
    -H "Content-Type: application/json" \
    -d '{
      "url": "https://<SUPABASE_PROJECT>.supabase.co/functions/v1/telegram-bot",
      "secret_token": "your-generated-secret-here"
    }'
  ```
  ⚠️ **Use the same secret you set in TELEGRAM_WEBHOOK_SECRET**
- [ ] Verify webhook:
  ```bash
  curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
  ```
- [ ] Configure Mini App in @BotFather:
  - Send `/newapp`
  - Select your bot
  - Set Web App URL: `https://matras-xyz.vercel.app`
  - Upload icon (640×360)

## Phase 6: Testing

### Functional Testing
- [ ] Open bot in Telegram
- [ ] Send `/start` → should show "Открыть каталог" button
- [ ] Click button → Mini App loads
- [ ] Browse catalog → add to cart → checkout
- [ ] Fill order form → submit
- [ ] Verify admin receives Telegram notification
- [ ] Test confirm/cancel buttons in admin notification

### Security Testing ⭐ **NEW**
- [ ] **Test price manipulation protection:**
  - Try to modify prices in browser DevTools
  - Order should use database prices, not client prices
- [ ] **Test rate limiting:**
  - Try to create 6+ orders quickly
  - Should get rate limit error after 5 orders
- [ ] **Test input validation:**
  - Try entering very long text (>1000 chars) in comment
  - Should show validation error
  - Try invalid phone format
  - Should show validation error
- [ ] **Test XSS protection:**
  - Enter `<script>alert('test')</script>` in comment
  - Should be escaped in admin notification
- [ ] **Test webhook security:**
  - Try sending fake webhook request without secret
  - Should be rejected with 401 Unauthorized

## Phase 7: Production Readiness

### Content & Data
- [ ] Replace mock products with real inventory
- [ ] Add real product images (upload to Supabase Storage)
- [ ] Update bot description and about text

### Security Hardening ⭐ **NEW**
- [ ] **Restrict CORS in Edge Functions:**
  - Edit `supabase/functions/*/index.ts`
  - Change `'Access-Control-Allow-Origin': '*'` to your domain
  - Example: `'Access-Control-Allow-Origin': 'https://matras.vercel.app'`
  - Redeploy all functions
- [ ] **Review SECURITY_AUDIT.md:**
  - Verify all Critical issues are fixed ✅
  - Verify all High priority issues are fixed ✅
  - Review Medium priority recommendations
- [ ] **Set up monitoring:**
  - Enable Supabase Edge Function logs
  - Set up alerts for errors
  - Monitor rate limit hits

### Optional Enhancements
- [ ] Set up analytics (Vercel Analytics / Plausible)
- [ ] Configure custom domain in Vercel
- [ ] Enable bot for production (@BotFather → `/mybots` → verify)
- [ ] Add privacy policy page
- [ ] Add terms of service page

## Phase 8: Post-Deployment Security ⭐ **NEW**

### Immediate Actions
- [ ] **Verify all Edge Functions are deployed:**
  ```bash
  supabase functions list
  ```
  Should show: telegram-auth, telegram-bot, create-order
- [ ] **Test webhook secret is working:**
  - Check Supabase logs for any 401 errors
  - Verify legitimate webhook requests succeed
- [ ] **Monitor first orders:**
  - Check prices match database
  - Verify notifications work
  - Check for any errors in logs

### Ongoing Security
- [ ] Schedule regular security audits (quarterly)
- [ ] Keep dependencies updated:
  ```bash
  npm audit
  npm update
  ```
- [ ] Monitor Supabase quotas and usage
- [ ] Review Edge Function logs weekly
- [ ] Rotate TELEGRAM_WEBHOOK_SECRET every 6 months

---

## Optional Enhancements
- [ ] Add payment integration (Telegram Payments API / Stripe)
- [ ] Add order status tracking page
- [ ] Add admin dashboard (separate bot commands)
- [ ] Add product reviews
- [ ] Add referral system
- [ ] Add analytics dashboard
- [ ] Implement CSP headers
- [ ] Add request signing for extra security

## Troubleshooting

### Common Issues
- **npm script errors on Windows:** Run `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` in PowerShell
- **Edge Function 500 errors:** Check logs with `supabase functions logs <function-name>`
- **No webhook updates:** Verify webhook URL and check TELEGRAM_BOT_TOKEN is correct
- **Orders not saving:** Check RLS policies and Supabase anon key permissions

### Security-Related Issues ⭐ **NEW**
- **Webhook 401 Unauthorized:**
  - Verify TELEGRAM_WEBHOOK_SECRET matches in both:
    - Supabase Edge Function secrets
    - Telegram webhook configuration
  - Check logs: `supabase functions logs telegram-bot`
  
- **Order creation fails with "Invalid order data":**
  - Check that frontend is sending correct data structure
  - Verify all required fields are present
  - Check browser console for errors
  
- **Rate limit errors:**
  - Normal behavior after 5 orders/hour per user
  - Wait 1 hour or test with different Telegram account
  - Adjust limits in `create-order/index.ts` if needed
  
- **Prices don't match:**
  - Verify products exist in database
  - Check product IDs are correct
  - Review `create-order` function logs

### Getting Help
- Review `SECURITY_AUDIT.md` for detailed security information
- Check Supabase logs: Dashboard → Edge Functions → Logs
- Enable verbose logging in development
- Contact support with specific error messages
