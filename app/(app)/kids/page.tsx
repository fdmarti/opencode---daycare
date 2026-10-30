import { mockKids } from "@/data/kids/mock-kids";
import { KidCard } from "@/components/kids/KidCard";
import { AddKidModal } from "@/components/kids/AddKidModal";
import { SearchIcon } from "@/components/common/icons/Icons";
import { CustomInput } from "@/components/common/ui/CustomInput";

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
        <AddKidModal />
      </div>

      {/* Static search: no onChange and no filtering until a future spec. */}
      <div className="flex items-center gap-2.75 bg-card border border-borde rounded-[14px] px-4 py-3 mb-5.5">
        <SearchIcon size={18} />
        <CustomInput
          variant="bare"
          placeholder="Buscar niño…"
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
