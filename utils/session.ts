/**
 * Derivaciones de la sesión, compartidas entre el hook de cliente
 * (`hooks/useSession.ts`) y el Server Component (`components/feed/FeedHeader.tsx`).
 *
 * La metadata se usa **solo para mostrar**: nunca para autorizar.
 */

export interface SessionData {
  /** user_metadata.full_name, o el email sin dominio si falta. */
  fullName: string;
  /** Primer token de fullName: lo que muestra el home. */
  firstName: string;
  /** Primera letra de firstName en mayúscula: el avatar del sidebar. */
  initial: string;
  /** app_metadata.role traducido a copy en español. */
  roleLabel: string;
  /** app_metadata.daycare_name; null cuando el usuario no lo tiene. */
  daycareName: string | null;
}

/** Forma mínima del usuario de Supabase que usan las derivaciones. */
export interface SessionUserLike {
  email?: string;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}

/** Copy en español para los roles conocidos de `app_metadata.role`. */
const ROLE_LABELS: Record<string, string> = {
  staff: "Staff",
  parent: "Familia",
  admin: "Admin",
};

export const EMPTY_SESSION: SessionData = {
  fullName: "",
  firstName: "",
  initial: "",
  roleLabel: "",
  daycareName: null,
};

/** Traduce el rol de `app_metadata`; los desconocidos se muestran tal cual. */
export function toRoleLabel(role: unknown): string {
  if (typeof role !== "string" || role.length === 0) {
    return "";
  }

  return ROLE_LABELS[role] ?? role;
}

/** Nombre completo: `user_metadata.full_name` o, si falta, el email sin dominio. */
export function toFullName(fullName: unknown, email: string | undefined): string {
  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName.trim();
  }

  return email?.split("@")[0] ?? "";
}

/** Deriva los datos visibles de la sesión a partir del usuario de Supabase. */
export function deriveSessionData(
  user: SessionUserLike | null | undefined,
): SessionData {
  if (!user) {
    return { ...EMPTY_SESSION };
  }

  const fullName = toFullName(user.user_metadata?.full_name, user.email);
  const firstName = fullName.split(" ")[0] ?? "";

  return {
    fullName,
    firstName,
    initial: firstName.charAt(0).toUpperCase(),
    roleLabel: toRoleLabel(user.app_metadata?.role),
    daycareName:
      typeof user.app_metadata?.daycare_name === "string"
        ? user.app_metadata.daycare_name
        : null,
  };
}
