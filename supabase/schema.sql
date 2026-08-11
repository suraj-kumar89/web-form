-- Bluvo website lead form
create extension if not exists pgcrypto;

create table if not exists public.website_leads (
  id uuid primary key default gen_random_uuid(),
  submitted_at timestamptz not null default now(),

  need text,
  goal text,
  stage text,
  channels text[] not null default '{}',
  current_url text,
  problems text[] not null default '{}',
  revenue text,
  platform text,
  page_for text,
  ad_spend text,
  page_count text,

  budget text,
  timeline text,
  company text,
  notes text,

  name text not null,
  phone text not null,
  email text not null,

  lead_score integer not null default 0,
  lead_band text not null,

  time_to_complete_sec integer,

  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  gclid text,
  fbclid text,
  wbraid text,
  gbraid text,
  referrer text,
  landing_page text,

  created_at timestamptz not null default now()
);

create index if not exists website_leads_created_at_idx
  on public.website_leads (created_at desc);

create index if not exists website_leads_lead_band_idx
  on public.website_leads (lead_band);

create index if not exists website_leads_email_idx
  on public.website_leads (email);

alter table public.website_leads enable row level security;

-- No public INSERT/SELECT policy is created.
-- The submit-lead Edge Function uses the server-side service role key.
