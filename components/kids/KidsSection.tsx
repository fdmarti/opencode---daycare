"use client";

import { useKids } from "@/hooks/useKids";
import { useRooms } from "@/hooks/useRooms";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsList } from "@/components/kids/KidsList";

/**
 * Pantalla de niños: header (kicker, título y botón de alta) más la lista.
 *
 * Es el único dueño de `useKids` y de `useRooms`, para que el botón
 * "Agregar niño" y el listado compartan la misma instancia del hook y el
 * `refetch` sin necesitar un context.
 */
export function KidsSection() {
  const { filteredKids, search, setSearch, isLoading, refetch } = useKids();
  const { rooms } = useRooms();

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5.5">
        <div>
          <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-acento mb-1">
            GESTIÓN
          </div>
          <h1 className="font-display font-semibold text-[30px] text-tinta">Niños</h1>
        </div>
        <AddKidModal rooms={rooms} onSaved={refetch} />
      </div>

      <KidsList
        kids={filteredKids}
        search={search}
        setSearch={setSearch}
        isLoading={isLoading}
      />
    </>
  );
}
