"use client";

import { useMemo } from "react";

import type { ChildWithRoomRow } from "@/data/kids/types";
import { useKids } from "@/hooks/useKids";
import { SearchIcon } from "@/components/common/icons/Icons";
import { CustomInput } from "@/components/common/ui/CustomInput";
import { Skeleton } from "@/components/common/ui/Skeleton";
import { KidCard } from "@/components/kids/KidCard";

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

/** Placeholder con la forma de una tarjeta, mientras carga la consulta. */
function KidCardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 min-w-0 bg-card border border-borde rounded-[18px] p-4">
      <Skeleton circle className="w-12 h-12" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function KidsList() {
  const { filteredKids, search, setSearch, isLoading } = useKids();

  const groups = useMemo(() => groupByRoom(filteredKids), [filteredKids]);

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
