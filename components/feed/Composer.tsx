import { CameraIcon } from '@/components/common/icons/Icons'

// Dead link until "crear publicación" lands in a future spec.
export function Composer() {
  return (
    <a
      href="#"
      className="flex items-center gap-[14px] bg-card border border-borde rounded-[18px] px-[18px] py-[14px] mb-6 shadow-[0_4px_14px_-10px_rgba(120,90,60,0.4)]"
    >
      <div className="w-10 h-10 rounded-full bg-avatar-usuario text-white font-display font-semibold text-base flex items-center justify-center flex-none">
        C
      </div>
      <span className="flex-1 text-placeholder text-[15px]">Compartí un momento…</span>
      <span className="w-[38px] h-[38px] rounded-xl bg-acento-claro text-[#E0654A] flex items-center justify-center">
        <CameraIcon />
      </span>
    </a>
  );
}
