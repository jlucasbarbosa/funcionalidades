create extension if not exists pgcrypto;

create table if not exists public.automation_settings (
  id text primary key,
  active_client_id uuid null,
  public_base_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  webhook_token text not null unique,
  ceci_company_id text null,
  timeout_minutes integer not null default 5 check (timeout_minutes between 1 and 240),
  transfer_window_start text null check (transfer_window_start is null or transfer_window_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  transfer_window_end text null check (transfer_window_end is null or transfer_window_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  transfer_department_id text null,
  transfer_department_name text null,
  wts_transfer_session_url text null,
  wts_api_token text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_clients
  add column if not exists transfer_window_start text null;

alter table public.automation_clients
  add column if not exists transfer_window_end text null;

create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.automation_clients(id) on delete cascade,
  received_at timestamptz not null default now(),
  event_type text not null,
  session_id text null,
  company_id text null,
  handled boolean not null default false,
  status_code integer not null,
  reason text null,
  error text null,
  payload jsonb not null default '{}'::jsonb
);

create table if not exists public.session_timeout (
  session_id text primary key,
  company_id text null,
  department_id text null,
  user_id text null,
  status text not null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.automation_action_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.automation_clients(id) on delete cascade,
  created_at timestamptz not null default now(),
  action_type text not null,
  session_id text null,
  status text not null,
  message text null,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.agent_automation_rules (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.automation_clients(id) on delete cascade,
  agent_id text not null,
  agent_name text null,
  enabled boolean not null default true,
  transfer_window_start text null check (transfer_window_start is null or transfer_window_start ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  transfer_window_end text null check (transfer_window_end is null or transfer_window_end ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, agent_id)
);

create index if not exists automation_clients_webhook_token_idx
  on public.automation_clients(webhook_token);

create index if not exists automation_clients_ceci_company_id_idx
  on public.automation_clients(ceci_company_id);

create index if not exists webhook_logs_client_received_idx
  on public.webhook_logs(client_id, received_at desc);

create index if not exists session_timeout_status_expires_idx
  on public.session_timeout(status, expires_at);

create index if not exists automation_action_logs_client_created_idx
  on public.automation_action_logs(client_id, created_at desc);

create index if not exists agent_automation_rules_client_idx
  on public.agent_automation_rules(client_id, agent_id);

insert into public.automation_settings (id)
values ('default')
on conflict (id) do nothing;

alter table public.automation_settings enable row level security;
alter table public.automation_clients enable row level security;
alter table public.webhook_logs enable row level security;
alter table public.session_timeout enable row level security;
alter table public.automation_action_logs enable row level security;
alter table public.agent_automation_rules enable row level security;
