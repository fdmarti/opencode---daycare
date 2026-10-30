-- OpenDayCare — Enums y tabla `users` (perfil de dominio sobre Supabase Auth)
--
-- Referencia: ../../07-DB-Schema/opendaycare-database-schema.md, sección 2.
--
-- RLS: habilitado SIN policies (deny-all), igual que `daycares`.
-- Las policies de multi-tenant consultan `public.users` y llegan en un spec
-- aparte, junto con el schema `private` y sus helpers.

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  daycare_id            uuid not null references public.daycares(id) on delete restrict,
  role                  public.user_role not null default 'parent',
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.users is
  'Perfil de dominio de cada usuario de Supabase Auth, vinculado a una guardería.';

create index users_daycare_id_idx on public.users (daycare_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

alter table public.users enable row level security;

grant select, insert, update, delete on public.users to authenticated;
revoke all on public.users from anon;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_daycare_id uuid;
  v_role       public.user_role;
  v_full_name  text;
begin
  -- El rol y la guardería se leen de raw_app_meta_data (controlado por el
  -- servidor); full_name viene de raw_user_meta_data (controlado por el
  -- usuario, solo se usa como texto visible).
  v_daycare_id := nullif(new.raw_app_meta_data ->> 'daycare_id', '')::uuid;
  v_role := case new.raw_app_meta_data ->> 'role'
              when 'staff' then 'staff'::public.user_role
              when 'admin' then 'admin'::public.user_role
              else 'parent'::public.user_role
            end;
  v_full_name := coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email);

  if v_daycare_id is null then
    return new;  -- sin guardería no se crea perfil; el signup no falla
  end if;

  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, v_daycare_id, v_role, v_full_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();
