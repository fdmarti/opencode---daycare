import { mockKids } from "@/data/kids/mock-kids";
import { KidCard } from "@/components/kids/KidCard";

export default function KidsPage() {
  return (
    <div className="max-w-220 w-full mx-auto px-10 pt-8.5 pb-20">
      <div className="flex items-end justify-between gap-4 mb-5.5">
        <div>
          <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-acento mb-1">
            GESTIÓN
          </div>
          <h1 className="font-display font-semibold text-[30px] text-tinta">Niños</h1>
        </div>
        {/* Dead link until "agregar niño" lands in a future spec. */}
        <a
          href="#"
          className="flex items-center gap-2 px-4.5 py-2.75 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)]"
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fff"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Agregar niño
        </a>
      </div>

      {/* Static search: no onChange and no filtering until a future spec. */}
      <div className="flex items-center gap-2.75 bg-card border border-borde rounded-[14px] px-4 py-3 mb-5.5">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          placeholder="Buscar niño…"
          className="flex-1 border-none bg-none text-[15px] text-tinta"
        />
      </div>

      <div className="flex items-center gap-3 mb-3.5">
        <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-tinta">
          SALA SOLES
        </span>
        <span className="text-[13px] text-placeholder">{mockKids.length} niños</span>
        <span className="flex-1 h-px bg-separador" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {mockKids.map((kid) => (
          <KidCard key={kid.id} kid={kid} />
        ))}
      </div>
    </div>
  );
}
