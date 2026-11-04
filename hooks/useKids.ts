"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChildWithRoomRow } from "@/data/kids/types";
import { createClient } from "@/utils/supabase/client";
import { normalizeForSearch } from "@/utils/kids";

export interface UseKidsState {
  /** Todos los niños de la base, sin filtrar. */
  kids: ChildWithRoomRow[];
  /** `kids` filtrados por el texto de búsqueda. */
  filteredKids: ChildWithRoomRow[];
  /** Texto actual del buscador. */
  search: string;
  /** Setter del texto del buscador. */
  setSearch: (value: string) => void;
  /** true mientras la consulta está en vuelo. */
  isLoading: boolean;
  /** Error de la consulta, si lo hubo. */
  error: Error | null;
  /** Relanza la consulta. */
  refetch: () => void;
}

/**
 * Listado de niños de `public.children`, con la sala embebida.
 *
 * El fetch se hace en el navegador con el cliente de `utils/supabase/client.ts`,
 * igual que `useSession`: el JWT lleva el `app_metadata` del usuario y son
 * las policies de RLS las que aíslan por guardería.
 *
 * La búsqueda es del lado del cliente sobre el listado ya descargado, con
 * normalización de diacríticos y minúsculas ("sofia" encuentra a "Sofía").
 */
export function useKids(): UseKidsState {
  const [kids, setKids] = useState<ChildWithRoomRow[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadKids() {
      setIsLoading(true);
      setError(null);

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

        if (cancelled) {
          return;
        }

        if (queryError) {
          setKids([]);
          setError(queryError);
          setIsLoading(false);
          return;
        }

        // Las filas se guardan tal cual llegan: el tipo es el de la base.
        setKids(data ?? []);
        setIsLoading(false);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setKids([]);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    }

    loadKids();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const filteredKids = useMemo(() => {
    const query = normalizeForSearch(search.trim());

    if (query.length === 0) {
      return kids;
    }

    return kids.filter((child) =>
      normalizeForSearch(child.full_name).includes(query),
    );
  }, [kids, search]);

  const refetch = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);

  return {
    kids,
    filteredKids,
    search,
    setSearch,
    isLoading,
    error,
    refetch,
  };
}
