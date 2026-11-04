/**
 * Derivaciones de los datos de niños que la base no guarda.
 *
 * La edad no está en la base: se deriva de `birth_date`. La normalización
 * sirve para buscar por nombre ignorando mayúsculas y acentos.
 *
 * El patrón es el de `utils/session.ts`: funciones puras, sin estado.
 */

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
