# Supabase setup

Run `schema.sql` in the Supabase SQL Editor.

Then deploy:

```bash
npx supabase functions deploy submit-lead --no-verify-jwt
```

Set Edge Function secrets from the Supabase Dashboard or CLI.

The function uses the service role key only server-side, so it can insert while RLS remains enabled.
