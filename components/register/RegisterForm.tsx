"use client";

import Link from "next/link";

import { SunIcon } from "@/components/common/icons/Icons";
import { mockInvite } from "@/data/register/mock-invite";

export function RegisterForm() {
  return (
    <div className="w-full">
      <div className="w-14.5 h-14.5 rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] flex items-center justify-center mb-5.5 shadow-[0_12px_26px_-10px_rgba(238,129,100,0.65)]">
        <SunIcon size={30} />
      </div>

      <h1 className="font-display text-[32px] font-semibold leading-[1.15] m-0 mb-2 text-tinta">
        Bienvenida a OpenDayCare
      </h1>
      <p className="m-0 mb-6.5 text-[15.5px] leading-[1.55] text-mute">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="flex items-center gap-3.5 bg-white border-[1.5px] border-[#EADFD0] rounded-2xl p-[14px_16px] mb-5.5">
        <div className="w-11 h-11 rounded-full bg-avatar-nino text-avatar-nino-tinta font-display font-semibold text-[19px] flex items-center justify-center">
          {mockInvite.childName.charAt(0)}
        </div>
        <div>
          <div className="text-[13px] text-mute">Te invitaron a seguir a</div>
          <div className="font-display font-semibold text-[17px] text-tinta">
            {mockInvite.childName} · {mockInvite.classroomName}
          </div>
        </div>
      </div>

      <form onSubmit={(event) => event.preventDefault()}>
        <label
          htmlFor="register-invite-code"
          className="block text-[12px] font-bold tracking-[0.7px] text-mute mb-2"
        >
          CÓDIGO DE INVITACIÓN
        </label>
        <input
          id="register-invite-code"
          type="text"
          defaultValue={mockInvite.inviteCode}
          className="w-full p-[14px_16px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white font-display text-[18px] font-bold tracking-[3px] text-tinta mb-4.5"
        />

        <label
          htmlFor="register-email"
          className="block text-[12px] font-bold tracking-[0.7px] text-mute mb-2"
        >
          EMAIL
        </label>
        <input
          id="register-email"
          type="email"
          defaultValue={mockInvite.email}
          className="w-full p-[14px_16px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-tinta mb-4.5"
        />

        <label
          htmlFor="register-password"
          className="block text-[12px] font-bold tracking-[0.7px] text-mute mb-2"
        >
          CREAR CONTRASEÑA
        </label>
        <input
          id="register-password"
          type="password"
          defaultValue={mockInvite.password}
          className="w-full p-[14px_16px] rounded-[14px] border-[1.5px] border-[#F2A78E] bg-white text-[15px] text-tinta mb-4.5"
        />

        <label className="flex items-start gap-3 bg-[#FBF1D6] rounded-[14px] p-[14px_16px] mb-6 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked
            className="flex-none w-6 h-6 mt-px rounded-lg accent-[#5FB97E]"
          />
          <span className="text-[14px] leading-[1.45] text-[#8A7234]">
            Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
            la app.
          </span>
        </label>

        <a
          href="#"
          className="block w-full p-3.75 rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] text-center shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
        >
          Activar mi cuenta
        </a>
      </form>

      <p className="text-center mt-5.5 mb-0 text-[14.5px] text-mute">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-acento-editar">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
