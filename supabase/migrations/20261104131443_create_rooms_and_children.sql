-- OpenDayCare — Tablas `rooms` y `children` (catálogo de niños de la guardería)
--
-- Referencia: ../../07-DB-Schema/opendaycare-database-schema.md, secciones 3 y 4.
--
-- Jerarquía: daycares (institución) → rooms (salas) → children (niños).
-- `children` no lleva `daycare_id`: la guardería se deduce por la sala.
--
-- RLS: habilitado SIN policies (deny-all), igual que `daycares` y `users`.
-- Las policies de multi-tenant consultan `public.users` y llegan en un spec
-- aparte, junto con el schema `private` y sus helpers.

create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name       text not null,
  created_at timestamptz not null default now(),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

comment on table public.rooms is
  'Salas de la guardería (ej. Soles, Lunas, Estrellas).';

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid not null references public.rooms(id) on delete restrict,
  full_name     text not null,
  birth_date    date not null,
  enrolled_at   date not null default current_date,
  medical_notes text,
  allergy_tags  text[] not null default '{}',
  photo_consent boolean not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.children is
  'Niños inscritos en la guardería, cada uno en una sala.';

create index children_room_id_idx on public.children (room_id);
create index children_status_idx on public.children (status);

create trigger children_set_updated_at
before update on public.children
for each row execute function public.set_updated_at();

alter table public.rooms enable row level security;
alter table public.children enable row level security;

grant select, insert, update, delete on public.rooms to authenticated;
grant select, insert, update, delete on public.children to authenticated;
revoke all on public.rooms from anon;
revoke all on public.children from anon;
