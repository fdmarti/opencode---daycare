// Tipos del perfil de niño, movidos desde el antiguo mock (eliminado en este
// spec). Los consume `components/kids/KidProfile.tsx`, que todavía no tiene
// ruta real, así que quedan aislados y sin uso.
// El perfil se reconstruirá con los tipos de la base cuando exista su spec.

export interface KidParent {
  id: string;
  name: string; // "Lucía Fernández"
  role: "Mamá" | "Papá";
  status: "active" | "pending"; // active → badge ACTIVA; pending → badge PENDIENTE
}

export interface Kid {
  id: string;
  name: string; // "Mateo Fernández"
  age: number; // 3 → "3 años"
  room: string; // "Soles" → header "Sala Soles" and data row "Sala"
  birthDate: string; // "2022-03-12" (YYYY-MM-DD) → "12 mar 2022"
  admissionDate: string; // "2025-02-01" (YYYY-MM-DD) → "feb 2025" (month + year only)
  allergy?: string; // "MANÍ" | "LACTOSA"; absent → no allergy badge
  allergyNotes?: string; // profile banner "Alergias y notas"; absent → no banner
  parents: KidParent[]; // 0 → card meta "sin padres vinculados", badge "VINCULAR", profile shows only the "Vincular otro padre" button
}
