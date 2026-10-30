export function LoginForm() {
  return (
    <div className="w-full max-w-98">
      <h2 className="font-display text-[30px] font-semibold text-tinta m-0 mb-1.5">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-7 text-[15px] text-mute">
        Ingresá para ver el día de hoy.
      </p>

      <label
        htmlFor="login-email"
        className="block text-[12px] font-bold tracking-[0.7px] text-mute mb-2"
      >
        EMAIL
      </label>
      <input
        id="login-email"
        type="email"
        placeholder="example@some.com"
        className="w-full p-[14px_16px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-tinta mb-4.5"
      />

      <label
        htmlFor="login-password"
        className="block text-[12px] font-bold tracking-[0.7px] text-mute mb-2"
      >
        CONTRASEÑA
      </label>
      <input
        id="login-password"
        type="password"
        placeholder="••••••••"
        className="w-full p-[14px_16px] rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white text-[15px] text-tinta mb-2.5"
      />

      <div className="text-right mb-5">
        <a
          href="#"
          className="text-[13.5px] font-bold text-acento-editar"
        >
          ¿Olvidaste tu contraseña?
        </a>
      </div>

      <a
        href="#"
        className="block w-full p-3.75 rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] text-center shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)]"
      >
        Iniciar sesión
      </a>

      <p className="text-center mt-6 mb-0 text-[14.5px] text-mute">
        ¿Te invitó la guardería?{" "}
        <a href="#" className="font-extrabold text-acento-editar">
          Activá tu cuenta
        </a>
      </p>
    </div>
  );
}
