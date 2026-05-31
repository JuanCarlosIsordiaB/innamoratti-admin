-- Innamoratti Focaccia — Schema de Base de Datos
-- Ejecutar en el SQL Editor de Supabase

create table users (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  role         text not null check (role in ('admin','cajero','cocinero','mesero','dueno')),
  access_code  text not null,
  code_display text not null,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

create table checklists (
  id           uuid primary key default gen_random_uuid(),
  area_id      text not null,
  user_id      uuid references users(id),
  date         date not null,
  status       text default 'in_progress' check (status in ('in_progress','completed')),
  completed_at timestamptz,
  created_at   timestamptz default now(),
  unique (area_id, date)
);

create table checklist_items (
  id             uuid primary key default gen_random_uuid(),
  checklist_id   uuid references checklists(id) on delete cascade,
  item_key       text not null,
  label          text not null,
  is_completed   boolean default false,
  note           text,
  completed_at   timestamptz,
  completed_by   uuid references users(id)
);

create table cash_close_details (
  id                uuid primary key default gen_random_uuid(),
  checklist_id      uuid references checklists(id) on delete cascade unique,
  denom_1000        int default 0,
  denom_500         int default 0,
  denom_200         int default 0,
  denom_100         int default 0,
  denom_50          int default 0,
  denom_20          int default 0,
  denom_10          int default 0,
  denom_5           int default 0,
  denom_1           int default 0,
  total_counted     numeric(10,2),
  fund_amount       numeric(10,2) default 1500,
  sales_amount      numeric(10,2),
  digital_signature text
);

-- Índices para consultas frecuentes
create index checklists_date_idx on checklists(date);
create index checklists_area_idx on checklists(area_id);
create index checklist_items_checklist_idx on checklist_items(checklist_id);
