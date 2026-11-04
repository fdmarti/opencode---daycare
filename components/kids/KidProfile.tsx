import Link from "next/link";
import { Avatar } from "@/components/common/avatars/Avatar";
import type { ChildWithRoomRow } from "@/data/kids/types";
import { ChevronIcon } from "@/components/common/icons/Icons";
import { ageFromBirthDate } from "@/utils/kids";

const MONTHS_SHORT_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

function formatDayMonthYear(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  return `${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

export function KidProfile({ child }: { child: ChildWithRoomRow }) {
  const hasAllergies =
    child.allergy_tags.length > 0 || (child.medical_notes ?? "").trim() !== "";

  return (
    <div className="max-w-205 w-full mx-auto px-10 pt-8.5 pb-20">
      <Link
        href="/kids"
        className="inline-flex items-center gap-1.75 text-[14px] font-bold text-mute mb-5"
      >
        <ChevronIcon size={18} rotate={90} />
        Volver a Niños
      </Link>

      <div className="flex gap-6.5 items-start flex-wrap">
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4.5">
          <div className="flex items-center gap-4.5">
            <Avatar size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-semibold text-[28px] text-tinta">
                {child.full_name}
              </h1>
              <p className="mt-0.75 text-[15px] text-mute">
                {ageFromBirthDate(child.birth_date)} años · Sala{" "}
                {child.rooms?.name ?? ""}
              </p>
            </div>
            <a
              href="#"
              className="flex-none border-[1.5px] border-borde bg-card text-nav font-bold text-[14px] px-4 py-2.25 rounded-xl"
            >
              Editar
            </a>
          </div>

          {hasAllergies && (
            <div className="bg-card border border-borde rounded-2xl px-4.5 py-4">
              <div className="font-extrabold text-tinta text-[15px] mb-2">
                Alergias y notas
              </div>
              {child.allergy_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {child.allergy_tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-[#FBD8CC] text-[#D9684A] rounded-full text-[11px] font-extrabold px-2.5 py-1"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {child.medical_notes && (
                <div className="text-[14.5px] text-mute leading-normal">
                  {child.medical_notes}
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-borde rounded-2xl overflow-hidden">
            <DataRow
              label="Fecha de nacimiento"
              value={formatDayMonthYear(child.birth_date)}
            />
            <DataRow label="Sala" value={child.rooms?.name ?? ""} />
            <DataRow
              label="Ingreso"
              value={formatMonthYear(child.enrolled_at)}
            />
          </div>
        </div>

        <div className="w-75 max-w-full flex-none flex flex-col gap-3.5">
          <a
            href="#"
            className="flex items-center justify-center gap-2.25 w-full py-3.25 rounded-[14px] bg-tinta text-white font-extrabold text-[15px]"
          >
            Resumen del día
          </a>

          <div className="bg-card border border-borde rounded-2xl px-4.5 py-4">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-3.5">
              PADRES VINCULADOS
            </div>
            <button
              type="button"
              disabled
              className="w-full rounded-xl border-2 border-dashed border-borde py-3 text-[14px] font-bold text-acento-editar opacity-60 cursor-not-allowed"
            >
              Vincular otro padre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4.5 py-3.75 border-b border-borde-suave last:border-b-0">
      <span className="text-[14.5px] text-mute">{label}</span>
      <span className="text-[14.5px] font-extrabold text-tinta">{value}</span>
    </div>
  );
}