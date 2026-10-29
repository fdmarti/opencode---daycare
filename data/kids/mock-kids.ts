// Screaming architecture: this mock data belongs to the kids domain.
// Repo rule: code in English, visible copy (strings) in Spanish.

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

export const mockKids: Kid[] = [
  {
    id: "kid-mateo",
    name: "Mateo Fernández",
    age: 3,
    room: "Soles",
    birthDate: "2022-03-12",
    admissionDate: "2025-02-01",
    allergy: "MANÍ",
    allergyNotes: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    parents: [
      { id: "parent-lucia", name: "Lucía Fernández", role: "Mamá", status: "active" },
      { id: "parent-diego", name: "Diego Fernández", role: "Papá", status: "pending" },
    ],
  },
  {
    id: "kid-sofia",
    name: "Sofía Méndez",
    age: 2,
    room: "Soles",
    birthDate: "2024-05-18",
    admissionDate: "2025-04-01",
    parents: [
      { id: "parent-carla", name: "Carla Méndez", role: "Mamá", status: "active" },
    ],
  },
  {
    id: "kid-benjamin",
    name: "Benjamín Ruiz",
    age: 3,
    room: "Soles",
    birthDate: "2023-08-02",
    admissionDate: "2025-09-01",
    parents: [
      { id: "parent-paula", name: "Paula Ruiz", role: "Mamá", status: "active" },
      { id: "parent-andres", name: "Andrés Ruiz", role: "Papá", status: "active" },
    ],
  },
  {
    id: "kid-valentina",
    name: "Valentina Soto",
    age: 2,
    room: "Soles",
    birthDate: "2024-11-25",
    admissionDate: "2026-03-01",
    parents: [],
  },
  {
    id: "kid-tomas",
    name: "Tomás Díaz",
    age: 3,
    room: "Soles",
    birthDate: "2023-01-30",
    admissionDate: "2025-06-01",
    allergy: "LACTOSA",
    allergyNotes:
      "Intolerancia a la lactosa. Sin lácteos en colaciones ni meriendas; ofrecer alternativas sin lactosa.",
    parents: [
      { id: "parent-mariana", name: "Mariana Díaz", role: "Mamá", status: "active" },
    ],
  },
  {
    id: "kid-emma",
    name: "Emma Castro",
    age: 2,
    room: "Soles",
    birthDate: "2024-09-14",
    admissionDate: "2025-08-01",
    parents: [
      { id: "parent-rodrigo", name: "Rodrigo Castro", role: "Papá", status: "active" },
    ],
  },
  {
    id: "kid-lucas",
    name: "Lucas Romero",
    age: 3,
    room: "Soles",
    birthDate: "2022-12-05",
    admissionDate: "2025-03-01",
    parents: [
      { id: "parent-hector", name: "Héctor Romero", role: "Papá", status: "active" },
    ],
  },
  {
    id: "kid-olivia",
    name: "Olivia Vega",
    age: 2,
    room: "Soles",
    birthDate: "2024-07-21",
    admissionDate: "2025-10-01",
    parents: [
      { id: "parent-veronica", name: "Verónica Vega", role: "Mamá", status: "active" },
    ],
  },
];
