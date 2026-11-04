"use client";

import { useMemo } from "react";

import { SearchIcon } from "@/components/common/icons/Icons";
import { CustomInput } from "@/components/common/ui/CustomInput";
import { KidCard } from "@/components/kids/KidCard";
import type { ChildWithRoomRow } from "@/data/kids/types";
import { useKidsStore } from "@/stores/kids-store";
import { filterKidsByName } from "@/utils/kids";
import { KidCardSkeleton } from "./KidCardSkeleton";

/** Agrupa los niños por nombre de sala; el orden de cada grupo es el de la consulta. */
function groupByRoom(kids: ChildWithRoomRow[]): [string, ChildWithRoomRow[]][] {
  const groups = new Map<string, ChildWithRoomRow[]>();

  for (const kid of kids) {
    const roomName = kid.rooms?.name ?? "";
    const group = groups.get(roomName);

    if (group) {
      group.push(kid);
    } else {
      groups.set(roomName, [kid]);
    }
  }

  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Listado de niños agrupado por sala, con el buscador.
 *
 * El estado viene del store de niños: la lista, el texto de búsqueda y el
 * estado de carga. El filtro por nombre se calcula acá con `useMemo`, para
 * que el store no devuelva un array nuevo en cada render.
 */
export function KidsList() {
  const kids = useKidsStore((state) => state.kids);
  const search = useKidsStore((state) => state.search);
  const setSearch = useKidsStore((state) => state.setSearch);
  const isLoading = useKidsStore((state) => state.isLoading);

  const groups = useMemo(
    () => groupByRoom(filterKidsByName(kids, search)),
    [kids, search],
  );

  return (
    <>
      <div className="flex items-center gap-2.75 bg-card border border-borde rounded-[14px] px-4 py-3 mb-5.5">
        <SearchIcon size={18} />
        <CustomInput
          variant="bare"
          placeholder="Buscar niño…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {Array.from({ length: 4 }, (_, index) => (
            <KidCardSkeleton key={index} />
          ))}
        </div>
      ) : (
        groups.map(([roomName, kids]) => (
          <section key={roomName} className="mb-6">
            <div className="flex items-center gap-3 mb-3.5">
              <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-tinta">
                SALA {roomName.toUpperCase()}
              </span>
              <span className="text-[13px] text-placeholder">
                {kids.length} niños
              </span>
              <span className="flex-1 h-px bg-separador" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {kids.map((kid) => (
                <KidCard key={kid.id} child={kid} />
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
