import Link from "next/link";
import { ChevronIconLeft } from '@/components/common/icons/Icons'

// In-app state for unknown kid ids, rendered inside the (app) shell.
export function KidNotFound() {
  return (
    <div className="max-w-220 w-full mx-auto px-10 pt-8.5 pb-20">
      <Link
        href="/kids"
        className="inline-flex items-center gap-1.75 text-[14px] font-bold text-mute mb-5"
      >
        <ChevronIconLeft />
        Volver a Niños
      </Link>
      <div className="bg-card border border-borde rounded-[18px] p-10 flex flex-col items-center gap-2 text-center">
        <h1 className="font-display font-semibold text-[24px] text-tinta">
          Niño no encontrado
        </h1>
        <p className="text-[14px] text-placeholder">
          Este niño no existe o fue removido del listado.
        </p>
      </div>
    </div>
  );
}
