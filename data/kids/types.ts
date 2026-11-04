// Los tipos de niños del repo son los de la base: la UI consume directamente
// la fila que devuelve la consulta, sin capa de vista intermedia.
// Repo rule: code in English, visible copy (strings) in Spanish.

/** Fila de `public.rooms`. */
export interface RoomRow {
  id: string;
  name: string; // "Rojo" → header "SALA ROJO"
}

/**
 * Fila de `public.children` con la sala embebida por PostgREST.
 *
 * El embedding es posible porque `children.room_id` es FK a `rooms.id`.
 */
export interface ChildWithRoomRow {
  id: string;
  full_name: string; // "Mateo Fernández"
  birth_date: string; // "2022-03-12" (YYYY-MM-DD)
  allergy_tags: string[]; // ["peanut"] — se muestran tal cual
  room_id: string;
  rooms: RoomRow | null; // null si la sala no es visible (RLS)
}
