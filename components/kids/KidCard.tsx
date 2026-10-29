import type { Kid } from "@/data/kids/mock-kids";

export function KidCard({ kid }: { kid: Kid }) {
  const meta =
    kid.linkedParents === 0
      ? `${kid.age} años · sin padres vinculados`
      : `${kid.age} años · ${kid.linkedParents} ${kid.linkedParents === 1 ? "padre vinculado" : "padres vinculados"}`;

  return (
    // Dead link until the kid profile lands in a future spec.
    <a
      href="#"
      className="group flex items-center gap-[14px] min-w-0 bg-card border border-borde rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-[2px]"
    >
      <div
        className={`flex-none w-12 h-12 rounded-full flex items-center justify-center font-display font-semibold text-[19px] ${kid.avatarClass}`}
      >
        {kid.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[16px] text-tinta">{kid.name}</div>
        <div className="text-[13px] text-placeholder">{meta}</div>
      </div>
      {kid.allergy ? (
        <span className="flex-none text-[11px] font-extrabold px-[9px] py-[5px] rounded-full bg-[#FBD8CC] text-[#D9684A]">
          {kid.allergy}
        </span>
      ) : kid.linkedParents === 0 ? (
        <span className="flex-none text-[11px] font-extrabold px-[9px] py-[5px] rounded-full bg-[#F9D2DE] text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <ChevronIcon />
      )}
    </a>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="flex-none"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#CBB89F"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
