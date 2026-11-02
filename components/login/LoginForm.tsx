"use client";

import Link from "next/link";
import { useActionState } from "react";

import { login } from "@/actions/auth";
import { CustomButton } from "@/components/common/ui/CustomButton";
import { CustomInput } from "@/components/common/ui/CustomInput";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <div className="w-full max-w-98">
      <form action={formAction}>
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

        {state?.error && (
          <p className="mt-2.5 mb-0 text-[13px] text-acento">{state.error}</p>
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
