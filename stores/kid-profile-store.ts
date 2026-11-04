"use client";

import { create } from "zustand";

import type { ChildWithRoomRow } from "@/data/kids/types";
import { createClient } from "@/utils/supabase/client";

export interface KidProfileStoreState {
  child: ChildWithRoomRow | null;
  isLoading: boolean;
  error: Error | null;
  fetchKid: (id: string) => Promise<void>;
}

export const useKidProfileStore = create<KidProfileStoreState>()((set) => ({
  child: null,
  isLoading: false,
  error: null,

  fetchKid: async (id) => {
    set({ isLoading: true, child: null, error: null });

    try {
      const supabase = createClient();
      const { data, error: queryError } = await supabase
        .from("children")
        .select(
          "id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, room_id, rooms(id, name)",
        )
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle()
        .overrideTypes<ChildWithRoomRow, { merge: false }>();

      if (queryError) {
        set({ child: null, error: queryError, isLoading: false });
        return;
      }

      set({ child: data ?? null, isLoading: false });
    } catch (err) {
      set({
        child: null,
        error: err instanceof Error ? err : new Error(String(err)),
        isLoading: false,
      });
    }
  },
}));