"use client";

import { create } from "zustand";

import { logout as logoutAction } from "@/actions/auth";
import { createClient } from "@/utils/supabase/client";
import {
  deriveSessionData,
  EMPTY_SESSION,
  type SessionData,
} from "@/utils/session";

export interface SessionStoreState extends SessionData {
  /** true mientras se resuelve la sesión; false cuando ya hay datos (o falló). */
  isLoading: boolean;
  /** Lee el usuario de Supabase y deriva los datos visibles. */
  fetchSession: () => Promise<void>;
  /** Cierra sesión y vuelve al login. */
  logout: () => Promise<void>;
}

/**
 * Estado global de la sesión del usuario logueado.
 *
 * El store es el dueño de la red y del logout: `fetchSession` lee el usuario
 * con `getUser()` y `logout` delega en la Server Action de `actions/auth.ts`.
 *
 * La metadata se usa solo para mostrar: nunca para autorizar.
 */
export const useSessionStore = create<SessionStoreState>()((set) => ({
  ...EMPTY_SESSION,
  isLoading: true,

  fetchSession: async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      set({ ...deriveSessionData(user), isLoading: false });
    } catch {
      // Fallo de red: sin datos y sin skeleton infinito.
      set({ ...EMPTY_SESSION, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await logoutAction();
    } finally {
      set({ ...EMPTY_SESSION, isLoading: false });
    }
  },
}));