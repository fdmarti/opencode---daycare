"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CustomButton } from "@/components/common/ui/CustomButton";
import { CustomInput } from "@/components/common/ui/CustomInput";

/**
 * Único mensaje propio del flujo: cubre el caso en que no hay respuesta de
 * Supabase que propagar (fallo de red o body no JSON).
 */
const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        router.push("/");
        return;
      }

      // Se propaga tal cual el `message` que devolvió Supabase.
      const body = (await response.json()) as { message?: string } | null;
      setError(body?.message ?? FALLBACK_MESSAGE);
    } catch {
      // Fallo de red o respuesta no JSON.
      setError(FALLBACK_MESSAGE);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-98">
      <form onSubmit={handleSubmit}>
        <h2 className="font-display text-[30px] font-semibold text-tinta m-0 mb-1.5">
          Iniciar sesión
        </h2>
        <p className="m-0 mb-7 text-[15px] text-mute">
          Ingresá para ver el día de hoy.
        </p>

        <CustomInput
          id="login-email"
          name="email"
          type="email"
          label="EMAIL"
          placeholder="example@some.com"
          className="mb-4.5"
          required
          autoComplete="email"
        />

        <CustomInput
          id="login-password"
          name="password"
          type="password"
          label="CONTRASEÑA"
          placeholder="••••••••"
          className="mb-2.5"
          required
          autoComplete="current-password"
        />

        <div className="text-right mb-5">
          <a
            href="#"
            className="text-[13.5px] font-bold text-acento-editar"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <CustomButton
          variant="primary"
          size="lg"
          type="submit"
          disabled={pending}
        >
          {pending ? "Ingresando…" : "Iniciar sesión"}
        </CustomButton>

        {error && (
          <p className="mt-2.5 mb-0 text-[13px] text-acento">{error}</p>
        )}
      </form>

      <p className="text-center mt-6 mb-0 text-[14.5px] text-mute">
        ¿Te invitó la guardería?{" "}
        <Link href="/register" className="font-extrabold text-acento-editar">
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
