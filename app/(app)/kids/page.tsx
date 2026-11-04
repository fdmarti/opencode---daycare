import { AddKidModal } from "@/components/kids/AddKidModal";
import { KidsList } from "@/components/kids/KidsList";

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

      <KidsList />
    </div>
  );
}
