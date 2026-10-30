// Mock data for the "nueva publicación" modal, in the feed domain.
// Repo rule: code in English, visible copy (strings) in Spanish.

export const mockPostTypes = [
  "Comida",
  "Siesta",
  "Actividad",
  "Logro",
  "Ánimo",
  "Foto",
  "Anuncio",
] as const;

export type MockPostType = (typeof mockPostTypes)[number];
