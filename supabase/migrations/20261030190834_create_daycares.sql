-- OpenDayCare — Tabla `daycares` (entidad raíz del modelo multi-tenant)
--
-- Referencia: ../07-DB-Schema/opendaycare-database-schema.md, sección 1.
--
-- Convenciones del proyecto:
--   * PK `id` uuid con default gen_random_uuid()
--   * created_at timestamptz not null default now()
--   * Todo lo persistido en inglés; las etiquetas visibles se traducen en la UI.
--
-- RLS: habilitado SIN policies. Los helpers de multi-tenant
-- (`private.current_daycare_id()`, `private.is_admin()`) consultan
-- `public.users`, que todavía no existe: las policies se agregan junto con
-- la tabla `users`. Con RLS activo y sin policies la tabla es deny-all:
-- las consultas devuelven 0 filas, sin error.

create table public.daycares (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

comment on table public.daycares is
  'Guarderías: entidad raíz del modelo multi-tenant.';

alter table public.daycares enable row level security;

grant select, insert, update, delete on public.daycares to authenticated;
revoke all on public.daycares from anon;
