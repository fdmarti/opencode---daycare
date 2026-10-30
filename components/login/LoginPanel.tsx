import { SunIcon } from '@/components/common/icons/Icons'

export function LoginPanel() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] flex flex-col justify-between p-[36px_28px] sm:p-[56px_60px] text-white">
      <div className="absolute w-105 h-105 rounded-full bg-white/12 -top-35 -right-30" />
      <div className="absolute w-75 h-75 rounded-full bg-white/10 -bottom-27.5 -left-20" />

      <div className="relative flex items-center gap-3.25">
        <div className="w-11.5 h-11.5 rounded-[14px] bg-white/22 flex items-center justify-center">
          <SunIcon />
        </div>
        <span className="font-display font-semibold text-[21px] tracking-[0.5px]">
          OpenDayCare
        </span>
      </div>

      <div className="relative">
        <h1 className="font-display font-semibold text-[34px] sm:text-[42px] leading-[1.12] m-0 mb-4.5">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="text-[17px] leading-[1.6] m-0 max-w-107.5 text-white/92">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <div className="relative text-[14px] text-white/90">🌿 Guardería Sala Soles</div>
    </div>
  );
}
