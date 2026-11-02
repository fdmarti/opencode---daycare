"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/utils/supabase/client";
import {
  deriveSessionData,
  EMPTY_SESSION,
  type SessionData,
} from "@/utils/session";

export type { SessionData };

export interface SessionState extends SessionData {
  /** true mientras se resuelve la sesión; false cuando ya hay datos (o falló). */
  isLoading: boolean;
}

/**
 * Sesión del usuario logueado, para mostrar sus datos.
 *
 * Usa `getUser()` (y no `getSession()`) para leer la metadata vigente del
 * servidor, aunque el JWT guardado en la cookie tenga claims viejos.
 *
 * La metadata se usa solo para mostrar: nunca para autorizar.
 */
export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({
    ...EMPTY_SESSION,
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (cancelled) {
          return;
        }

        setState({
          ...deriveSessionData(user),
          isLoading: false,
        });
      } catch {
        // Fallo de red: sin datos y sin skeleton infinito.
        if (!cancelled) {
          setState({ ...EMPTY_SESSION, isLoading: false });
        }
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
