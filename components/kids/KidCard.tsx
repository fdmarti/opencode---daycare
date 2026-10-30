import Link from "next/link";
import type { Kid } from "@/data/kids/mock-kids";
import { Avatar } from "@/components/common/avatars/Avatar";
import { ChevronIconRight } from "@/components/common/icons/Icons";

export function KidCard({ kid }: { kid: Kid }) {
  const parentCount = kid.parents.length;
  const meta =
    parentCount === 0
      ? `${kid.age} años · sin padres vinculados`
      : `${kid.age} años · ${parentCount} ${parentCount === 1 ? "padre vinculado" : "padres vinculados"}`;

  return (
    <Link
      href={`/kids/${kid.id}`}
      className="group flex items-center gap-3.5 min-w-0 bg-card border border-borde rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      <Avatar size="md" />
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[16px] text-tinta">{kid.name}</div>
        <div className="text-[13px] text-placeholder">{meta}</div>
      </div>
      {kid.allergy ? (
        <span className="flex-none text-[11px] font-extrabold px-2.25 py-1.25 rounded-full bg-[#FBD8CC] text-[#D9684A]">
          {kid.allergy}
        </span>
      ) : parentCount == 0 ? (
        <span className="flex-none text-[11px] font-extrabold px-2.25 py-1.25 rounded-full bg-[#F9D2DE] text-[#C56486]">
          VINCULAR
        </span>
      ) : (
        <ChevronIconRight size={18} />
      )}
    </Link>
  );
}
