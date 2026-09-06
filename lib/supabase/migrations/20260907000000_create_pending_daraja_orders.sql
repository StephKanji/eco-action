-- Migration: create pending_daraja_orders table
-- Stores pending M-Pesa STK push orders until the Daraja callback confirms payment

create table if not exists pending_daraja_orders (
  id                  uuid primary key default gen_random_uuid(),
  checkout_request_id text not null unique,   -- from Daraja STK push response, used by callback
  org_id              uuid not null references organizations(id) on delete cascade,
  package_id          uuid not null,          -- references points_packages(id)
  points              integer not null,
  amount_kes          numeric(10, 2) not null,
  phone               text not null,
  status              text not null default 'pending', -- pending | completed | failed
  mpesa_receipt       text,                   -- filled in by callback on success
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Index for fast callback lookup
create index if not exists idx_pending_daraja_checkout_request
  on pending_daraja_orders (checkout_request_id);

-- Auto-update updated_at on row change
create or replace function update_pending_daraja_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_pending_daraja_updated_at
  before update on pending_daraja_orders
  for each row execute procedure update_pending_daraja_updated_at();
