"use client";

import { useEffect } from "react";

import { useRooms } from "@/hooks/useRooms";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsList } from "@/components/kids/KidsList";
import { useKidsStore } from "@/stores/kids-store";

/**
 * Pantalla de niños: header (kicker, título y botón de alta) más la lista.
 *
 * La consulta a `children` la dispara el store al montar la pantalla; el
 * listado y el modal de alta leen el mismo estado global.
 */
export function KidsSection() {
  const { rooms } = useRooms();
  const fetchKids = useKidsStore((state) => state.fetchKids);

  useEffect(() => {
    fetchKids();
  }, [fetchKids]);

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-5.5">
        <div>
          <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-acento mb-1">
            GESTIÓN
          </div>
          <h1 className="font-display font-semibold text-[30px] text-tinta">Niños</h1>
        </div>
        <AddKidModal rooms={rooms} />
      </div>

      <KidsList />
    </>
  );
}
