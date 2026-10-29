// Screaming architecture: this mock data belongs to the kids domain.
// Repo rule: code in English, visible copy (strings) in Spanish.

export interface Kid {
  id: string;
  name: string; // "Mateo Fernández"
  age: number; // 3 → "3 años"
  linkedParents: number; // 2 → "2 padres vinculados"; 0 → "sin padres vinculados"
  allergy?: string; // "MANÍ" | "LACTOSA"; absent → no allergy badge
  /** Full Tailwind literal classes; Tailwind does not generate interpolated strings. */
  avatarClass: string; // e.g. "bg-[#A9D9E8] text-[#1F7A93]"
}

export const mockKids: Kid[] = [
  {
    id: "kid-mateo",
    name: "Mateo Fernández",
    age: 3,
    linkedParents: 2,
    allergy: "MANÍ",
    avatarClass: "bg-[#A9D9E8] text-[#1F7A93]",
  },
  {
    id: "kid-sofia",
    name: "Sofía Méndez",
    age: 2,
    linkedParents: 1,
    avatarClass: "bg-[#F4B8CC] text-[#C44A7A]",
  },
  {
    id: "kid-benjamin",
    name: "Benjamín Ruiz",
    age: 3,
    linkedParents: 2,
    avatarClass: "bg-[#B9DEC4] text-[#3E8B62]",
  },
  {
    id: "kid-valentina",
    name: "Valentina Soto",
    age: 2,
    linkedParents: 0,
    avatarClass: "bg-[#F4DC8E] text-[#9A7B1E]",
  },
  {
    id: "kid-tomas",
    name: "Tomás Díaz",
    age: 3,
    linkedParents: 1,
    allergy: "LACTOSA",
    avatarClass: "bg-[#C9B6E8] text-[#7B5FC0]",
  },
  {
    id: "kid-emma",
    name: "Emma Castro",
    age: 2,
    linkedParents: 1,
    avatarClass: "bg-[#F4B8CC] text-[#C44A7A]",
  },
  {
    id: "kid-lucas",
    name: "Lucas Romero",
    age: 3,
    linkedParents: 1,
    avatarClass: "bg-[#A9D9E8] text-[#1F7A93]",
  },
  {
    id: "kid-olivia",
    name: "Olivia Vega",
    age: 2,
    linkedParents: 1,
    avatarClass: "bg-[#B9DEC4] text-[#3E8B62]",
  },
];
