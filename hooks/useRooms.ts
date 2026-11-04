"use client";

import { useEffect, useState } from "react";

import type { RoomRow } from "@/data/kids/types";
import { createClient } from "@/utils/supabase/client";

export interface UseRoomsState {
  /** Filas de `public.rooms`, ordenadas por nombre. */
  rooms: RoomRow[];
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
}

/**
 * Listado de salas de `public.rooms`.
 *
 * El fetch se hace en el navegador con el cliente de `utils/supabase/client.ts`,
 * igual que `useKids`: el aislamiento por guardería lo resuelven las policies
 * de RLS.
 */
export function useRooms(): UseRoomsState {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      setIsLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from("rooms")
          .select("id, name")
          .order("name")
          // Sin tipos generados de Supabase: el tipo de la fila lo declara el repo.
          .overrideTypes<RoomRow[], { merge: false }>();

        if (cancelled) {
          return;
        }

        if (queryError) {
          setRooms([]);
          setError(queryError);
          setIsLoading(false);
          return;
        }

        // Las filas se guardan tal cual llegan: el tipo es el de la base.
        setRooms(data ?? []);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setRooms([]);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  return { rooms, isLoading, error };
}
