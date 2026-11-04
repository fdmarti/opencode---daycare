"use client";

import { create } from "zustand";

import type { RoomRow } from "@/data/kids/types";
import { createClient } from "@/utils/supabase/client";

export interface RoomsStoreState {
  /** Filas de `public.rooms`, ordenadas por nombre. */
  rooms: RoomRow[];
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Consulta `public.rooms` y reemplaza la lista. */
  fetchRooms: () => Promise<void>;
}

/**
 * Estado global de las salas.
 *
 * El store es el dueño de la red: `fetchRooms` consulta `public.rooms`.
 * El fetch se hace en el navegador con el cliente de `utils/supabase/client.ts`;
 * el aislamiento por guardería lo resuelven las policies de RLS.
 */
export const useRoomsStore = create<RoomsStoreState>()((set) => ({
  rooms: [],
  isLoading: true,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true, error: null });

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("rooms")
        .select("id, name")
        .order("name")
        // Sin tipos generados de Supabase: el tipo de la fila lo declara el repo.
        .overrideTypes<RoomRow[], { merge: false }>();

      if (queryError) {
        set({ rooms: [], error: queryError, isLoading: false });
        return;
      }

      // Las filas se guardan tal cual llegan: el tipo es el de la base.
      set({ rooms: data ?? [], isLoading: false });
    } catch (err) {
      set({
        rooms: [],
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      });
    }
  },
}));