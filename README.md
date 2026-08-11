# Bluvo Lead Form — Next.js + TypeScript + Supabase

This is a React/Next.js conversion of the supplied `bluvo-lead-form.html`.

Lead submission is now:

```text
Next.js form
   ↓
Supabase Edge Function: submit-lead
   ↓
Supabase PostgreSQL: website_leads
   ↓
Resend
   ├── Admin notification email
   └── Optional customer confirmation email
```

Supabase Edge Functions are server-side TypeScript and are suitable for transactional email integrations. Keep the Resend API key and Supabase service-role key inside Edge Function secrets, never in the browser.

## 1. Install

```bash
npm install
```

## 2. Configure Next.js

Copy:

```bash
cp .env.local.example .env.local
```

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Do NOT put the Supabase service-role key in `.env.local`.

## 3. Create the database table

Open Supabase Dashboard → SQL Editor and run:

```text
supabase/schema.sql
```

The table is `public.website_leads`.

RLS is enabled and there is intentionally no public INSERT policy. The Edge Function writes using its server-side service role key.

## 4. Create the Edge Function

The function is:

```text
supabase/functions/submit-lead/index.ts
```

Deploy it with the Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy submit-lead --no-verify-jwt
```

The function is intentionally public because this is a public lead form. The function itself validates the required fields. For a high-traffic production form, add rate limiting and/or Cloudflare Turnstile.

## 5. Add Supabase Edge Function secrets

Set these in Supabase Dashboard → Edge Functions → Secrets, or via CLI:

```text
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NOTIFICATION_EMAIL
FROM_EMAIL
SEND_CUSTOMER_EMAIL
```

Example:

```bash
npx supabase secrets set   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY   RESEND_API_KEY=re_xxxxxxxxx   NOTIFICATION_EMAIL=hello@yourdomain.com   FROM_EMAIL='Bluvo Leads <leads@yourdomain.com>'   SEND_CUSTOMER_EMAIL=true
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RESEND_API_KEY` to the browser.

## 6. Resend setup

Create a Resend account, create an API key, and verify the sending domain.

Your `FROM_EMAIL` must use a verified sending domain, for example:

```text
Bluvo Leads <leads@bluvo.studio>
```

## 7. Run

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## What happens after submission

The form sends the full lead payload to:

```text
submit-lead
```

The Edge Function:

1. Validates name, email, phone, project, budget and lead band.
2. Inserts the lead into `public.website_leads`.
3. Sends an admin notification through Resend.
4. Optionally sends a confirmation email to the customer.
5. Returns the Supabase lead ID.
6. The frontend shows the existing success/decline screen.

The existing GTM events, UTM/GCLID/FBCLID tracking, lead scoring, branching and WhatsApp behavior remain in the frontend.
