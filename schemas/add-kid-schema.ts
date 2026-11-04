/**
 * Schema de validación del formulario de alta de niños.
 *
 * La validación vive en el schema y no en el componente: el modal solo
 * consume los mensajes y el tipo `AddKidFormValues` se deriva con `z.infer`.
 *
 * Repo rule: code in English, visible copy (strings) in Spanish.
 */

import { z } from "zod";

import { todayISO } from "@/utils/kids";

export const REQUIRED_MESSAGE = "Este campo es obligatorio";
export const FUTURE_DATE_MESSAGE = "La fecha no puede ser futura";

export const addKidSchema = z.object({
  name: z.string().trim().min(1, REQUIRED_MESSAGE),
  birthDate: z
    .string()
    .min(1, REQUIRED_MESSAGE)
    // El `max` del input de fecha es solo ayuda visual: la garantía es esta.
    .refine((value) => value <= todayISO(), FUTURE_DATE_MESSAGE),
  room: z.string().min(1, REQUIRED_MESSAGE),
  allergies: z.string(),
  medicalNotes: z.string().trim(),
});

export type AddKidFormValues = z.infer<typeof addKidSchema>;
