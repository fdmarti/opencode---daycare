import Link from "next/link";
import type { ChildWithRoomRow } from "@/data/kids/types";
import { ageFromBirthDate } from "@/utils/kids";
import { Avatar } from "@/components/common/avatars/Avatar";
import { ChevronIcon } from "@/components/common/icons/Icons";

export function KidCard({ child }: { child: ChildWithRoomRow }) {
  const age = ageFromBirthDate(child.birth_date);
  const meta = `${age} años`;
  const allergy = child.allergy_tags.join(", ");

  return (
    <Link
      href={`/kids/${child.id}`}
      className="group flex items-center gap-3.5 min-w-0 bg-card border border-borde rounded-[18px] p-4 shadow-[0_4px_14px_-12px_rgba(120,90,60,0.5)] transition duration-150 hover:border-[#F2A78E] hover:-translate-y-0.5"
    >
      <Avatar size="md" />
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-[16px] text-tinta">
          {child.full_name}
        </div>
        <div className="text-[13px] text-placeholder">{meta}</div>
      </div>
      {allergy ? (
        <span className="flex-none text-[11px] font-extrabold px-2.25 py-1.25 rounded-full bg-[#FBD8CC] text-[#D9684A]">
          {allergy}
        </span>
      ) : (
        <span className="flex-none text-[#CBB89F]">
          <ChevronIcon size={18} rotate={-90} />
        </span>
      )}
    </Link>
  );
}
