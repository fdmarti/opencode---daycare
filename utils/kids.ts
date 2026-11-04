/**
 * Derivaciones de los datos de niños que la base no guarda.
 *
 * La edad no está en la base: se deriva de `birth_date`. La normalización
 * sirve para buscar por nombre ignorando mayúsculas y acentos.
 *
 * El patrón es el de `utils/session.ts`: funciones puras, sin estado.
 */

import type { ChildWithRoomRow } from "@/data/kids/types";

/** Años cumplidos a hoy desde "YYYY-MM-DD". */
export function ageFromBirthDate(birthDate: string): number {
  const [year, month, day] = birthDate.split("-").map(Number);

  if (!year || !month || !day) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - year;

  const monthDiff = today.getMonth() + 1 - month;

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) {
    age -= 1;
  }

  return age;
}

/** Minúsculas sin diacríticos, para comparar nombres. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Divide el texto libre de alergias en tags, sin vacíos. */
export function parseAllergyTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

/**
 * Filtra niños por nombre, ignorando mayúsculas y acentos.
 *
 * Con la búsqueda vacía devuelve la lista completa.
 */
export function filterKidsByName(
  kids: ChildWithRoomRow[],
  search: string,
): ChildWithRoomRow[] {
  const query = normalizeForSearch(search.trim());

  if (query.length === 0) {
    return kids;
  }

  return kids.filter((child) =>
    normalizeForSearch(child.full_name).includes(query),
  );
}

/** Hoy en "YYYY-MM-DD" en la zona horaria local. */
export function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}
