"use client";

import { create } from "zustand";

import type { ChildWithRoomRow } from "@/data/kids/types";
import { createClient } from "@/utils/supabase/client";

/** Payload del insert en `public.children`. */
export interface AddKidPayload {
  room_id: string;
  full_name: string;
  /** "YYYY-MM-DD". */
  birth_date: string;
  medical_notes: string | null;
  allergy_tags: string[];
}

export interface KidsStoreState {
  /** Todos los niños de la base, sin filtrar. */
  kids: ChildWithRoomRow[];
  /** Texto actual del buscador. */
  search: string;
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Setter del texto del buscador. */
  setSearch: (value: string) => void;
  /** Consulta `public.children` y reemplaza la lista. */
  fetchKids: () => Promise<void>;
  /** Inserta un niño en `public.children` y recarga la lista. */
  addKid: (payload: AddKidPayload) => Promise<void>;
}

/**
 * Estado global de la pantalla de niños.
 *
 * El store es el dueño de la red: `fetchKids` consulta `public.children` y
 * `addKid` inserta. El filtro por nombre no vive acá, se calcula en el
 * componente con `useMemo` para no devolver un array nuevo en cada render.
 *
 * El fetch se hace en el navegador con el cliente de `utils/supabase/client.ts`,
 * igual que `useSession`: el JWT lleva el `app_metadata` del usuario y son
 * las policies de RLS las que aíslan por guardería.
 */
export const useKidsStore = create<KidsStoreState>()((set) => ({
  kids: [],
  search: "",
  isLoading: false,
  error: null,

  setSearch: (value) => set({ search: value }),

  fetchKids: async () => {
    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("children")
        .select(
          "id, full_name, birth_date, allergy_tags, room_id, rooms(id, name)",
        )
        .eq("status", "active")
        .order("full_name")
        // Sin tipos generados de Supabase: el tipo de la fila lo declara el repo.
        .overrideTypes<ChildWithRoomRow[], { merge: false }>();

      if (queryError) {
        set({ kids: [], error: queryError, isLoading: false });
        return;
      }

      // Las filas se guardan tal cual llegan: el tipo es el de la base.
      set({ kids: data ?? [], isLoading: false });
    } catch (err) {
      set({
        kids: [],
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      });
    }
  },

  addKid: async (payload) => {
    const supabase = createClient();

    // `.select("id")` hace que el insert devuelva la fila insertada y que
    // los errores de RLS o de constraint lleguen como error del insert.
    const { error: insertError } = await supabase
      .from("children")
      .insert(payload)
      .select("id")
      .single();

    if (insertError) {
      // El error del alta es estado del formulario, no de la consulta.
      throw insertError;
    }

    await useKidsStore.getState().fetchKids();
  },
}));
