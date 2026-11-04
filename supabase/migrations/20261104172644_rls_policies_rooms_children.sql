-- OpenDayCare — Policies de RLS de lectura/escritura sobre `rooms` y `children`
--
-- Referencia: ../../07-DB-Schema/opendaycare-database-schema.md, secciones 3 y 4.
--
-- Contexto: `rooms` y `children` se crearon con RLS habilitado SIN policies
-- (deny-all), así que la app no podía leer las salas ni insertar niños.
--
-- Modelo de multi-tenant: el usuario autenticado pertenece a una guardería
-- (`public.users.daycare_id`) y su rol (`staff` | `admin` | `parent`) define
-- qué puede hacer. `children` no tiene `daycare_id`: la guardería se deduce
-- por la sala (`children.room_id` → `rooms.daycare_id`).
--
-- Los helpers viven en el schema `private` con SECURITY DEFINER: consultan
-- `public.users` (que tiene RLS deny-all) saltándose ese RLS, y solo se les
-- concede EXECUTE a `authenticated`.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

comment on schema private is
  'Helpers de autorización; no se exponen en el API público de PostgREST.';

create or replace function private.current_daycare_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.daycare_id
  from public.users u
  where u.id = auth.uid()
    and u.status = 'active';
$$;

create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select u.role
  from public.users u
  where u.id = auth.uid()
    and u.status = 'active';
$$;

create or replace function private.can_manage_children()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(private.current_user_role() in ('staff', 'admin'), false);
$$;

revoke all on function private.current_daycare_id() from public;
revoke all on function private.current_user_role() from public;
revoke all on function private.can_manage_children() from public;

grant execute on function private.current_daycare_id() to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.can_manage_children() to authenticated;

-- Salas: lectura para cualquier miembro activo de la guardería; escritura para
-- staff y admin.

create policy rooms_select_own_daycare on public.rooms
for select to authenticated
using (
  private.current_daycare_id() is not null
  and daycare_id = private.current_daycare_id()
);

create policy rooms_insert_own_daycare_staff on public.rooms
for insert to authenticated
with check (
  private.can_manage_children()
  and daycare_id = private.current_daycare_id()
);

create policy rooms_update_own_daycare_staff on public.rooms
for update to authenticated
using (
  private.can_manage_children()
  and daycare_id = private.current_daycare_id()
)
with check (
  private.can_manage_children()
  and daycare_id = private.current_daycare_id()
);

create policy rooms_delete_own_daycare_staff on public.rooms
for delete to authenticated
using (
  private.can_manage_children()
  and daycare_id = private.current_daycare_id()
);

-- Niños: la guardería se deduce por la sala. Solo staff y admin.

create policy children_select_own_daycare_staff on public.children
for select to authenticated
using (
  private.can_manage_children()
  and exists (
    select 1
    from public.rooms r
    where r.id = children.room_id
      and r.daycare_id = private.current_daycare_id()
  )
);

create policy children_insert_own_daycare_staff on public.children
for insert to authenticated
with check (
  private.can_manage_children()
  and exists (
    select 1
    from public.rooms r
    where r.id = children.room_id
      and r.daycare_id = private.current_daycare_id()
  )
);

create policy children_update_own_daycare_staff on public.children
for update to authenticated
using (
  private.can_manage_children()
  and exists (
    select 1
    from public.rooms r
    where r.id = children.room_id
      and r.daycare_id = private.current_daycare_id()
  )
)
with check (
  private.can_manage_children()
  and exists (
    select 1
    from public.rooms r
    where r.id = children.room_id
      and r.daycare_id = private.current_daycare_id()
  )
);

create policy children_delete_own_daycare_staff on public.children
for delete to authenticated
using (
  private.can_manage_children()
  and exists (
    select 1
    from public.rooms r
    where r.id = children.room_id
      and r.daycare_id = private.current_daycare_id()
  )
);
