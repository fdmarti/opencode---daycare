import Link from "next/link";

import { CustomButton } from "@/components/common/ui/CustomButton";
import { CustomInput } from "@/components/common/ui/CustomInput";

export function LoginForm() {
  return (
    <div className="w-full max-w-98">
      <h2 className="font-display text-[30px] font-semibold text-tinta m-0 mb-1.5">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-7 text-[15px] text-mute">
        Ingresá para ver el día de hoy.
      </p>

      <CustomInput
        id="login-email"
        type="email"
        label="EMAIL"
        placeholder="example@some.com"
        className="mb-4.5"
      />

      <CustomInput
        id="login-password"
        type="password"
        label="CONTRASEÑA"
        placeholder="••••••••"
        className="mb-2.5"
      />

      <div className="text-right mb-5">
        <a
          href="#"
          className="text-[13.5px] font-bold text-acento-editar"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <CustomButton variant="primary" size="lg" type="button">
        Iniciar sesión
      </CustomButton>

      <p className="text-center mt-6 mb-0 text-[14.5px] text-mute">
        ¿Te invitó la guardería?{" "}
        <Link href="/register" className="font-extrabold text-acento-editar">
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
