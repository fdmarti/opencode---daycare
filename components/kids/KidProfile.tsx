import Link from "next/link";
import { Avatar } from "@/components/common/avatars/Avatar";
import type { Kid, KidParent } from "@/data/kids/mock-kids";
import { ChevronIconLeft } from "@/components/common/icons/Icons";

// Short month names in Spanish; two fixed formats don't justify a date library.
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

// "2022-03-12" → "12 mar 2022"
function formatDayMonthYear(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

// "2025-02-01" → "feb 2025" (the day is ignored on purpose)
function formatMonthYear(isoDate: string): string {
  const [year, month] = isoDate.split("-").map(Number);
  return `${MONTHS_SHORT_ES[month - 1]} ${year}`;
}

// "Mamá · activa" / "Papá · activo" / "<role> · invitación enviada"
function parentSubtitle(parent: KidParent): string {
  if (parent.status === "pending") {
    return `${parent.role} · invitación enviada`;
  }
  return `${parent.role} · ${parent.role === "Mamá" ? "activa" : "activo"}`;
}

export function KidProfile({ kid }: { kid: Kid }) {
  return (
    <div className="max-w-205 w-full mx-auto px-10 pt-8.5 pb-20">
      <Link
        href="/kids"
        className="inline-flex items-center gap-1.75 text-[14px] font-bold text-mute mb-5"
      >
        <ChevronIconLeft size={18} />
        Volver a Niños
      </Link>

      <div className="flex gap-6.5 items-start flex-wrap">
        <div className="flex-[1_1_300px] min-w-0 flex flex-col gap-4.5">
          {/* Header */}
          <div className="flex items-center gap-4.5">
            <Avatar size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-semibold text-[28px] text-tinta">
                {kid.name}
              </h1>
              <p className="mt-0.75 text-[15px] text-mute">
                {kid.age} años · Sala {kid.room}
              </p>
            </div>
            {/* Dead link until "editar niño" lands in a future spec. */}
            <a
              href="#"
              className="flex-none border-[1.5px] border-borde bg-card text-nav font-bold text-[14px] px-4 py-2.25 rounded-xl"
            >
              Editar
            </a>
          </div>

          {/* Allergy notes banner: only when the kid has notes. */}
          {kid.allergyNotes && (
            <div className="flex gap-3.5 bg-[#FBDAD6] rounded-2xl px-4.5 py-4">
              <span className="flex-none w-10 h-10 rounded-[11px] bg-[#F4A8A0] flex items-center justify-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
              </span>
              <div>
                <div className="font-extrabold text-[#C5413A] text-[15px] mb-0.5">
                  Alergias y notas
                </div>
                <div className="text-[#B25249] text-[14.5px] leading-normal">
                  {kid.allergyNotes}
                </div>
              </div>
            </div>
          )}

          {/* Data card */}
          <div className="bg-card border border-borde rounded-2xl overflow-hidden">
            <DataRow
              label="Fecha de nacimiento"
              value={formatDayMonthYear(kid.birthDate)}
            />
            <DataRow label="Sala" value={kid.room} />
            <DataRow label="Ingreso" value={formatMonthYear(kid.admissionDate)} />
          </div>
        </div>

        <div className="w-75 max-w-full flex-none flex flex-col gap-3.5">
          {/* Dead link until "resumen del día" lands in a future spec. */}
          <a
            href="#"
            className="flex items-center justify-center gap-2.25 w-full py-3.25 rounded-[14px] bg-tinta text-white font-extrabold text-[15px]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
            Resumen del día
          </a>

          {/* Parents panel: always visible, even with zero parents. */}
          <div className="bg-card border border-borde rounded-2xl px-4.5 py-4">
            <div className="text-[12.5px] font-extrabold tracking-[0.8px] text-[#8A7C6D] mb-3.5">
              PADRES VINCULADOS
            </div>
            <div className="flex flex-col gap-3.5">
              {kid.parents.map((parent) => (
                <div key={parent.id} className="flex items-center gap-3">
                  <Avatar size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14.5px] font-extrabold text-tinta">
                      {parent.name}
                    </div>
                    <div className="text-[12.5px] text-placeholder">
                      {parentSubtitle(parent)}
                    </div>
                  </div>
                  <ParentStatusBadge status={parent.status} />
                </div>
              ))}
              {/* Dead link until "vincular padre" lands in a future spec. */}
              <a href="#" className="flex items-center gap-3 pt-2">
                <span className="flex-none w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA] flex items-center justify-center text-foto-tinta">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span className="text-[14.5px] font-extrabold text-acento-editar">
                  Vincular otro padre
                </span>
              </a>
            </div>
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

function ParentStatusBadge({ status }: { status: KidParent["status"] }) {
  if (status === "active") {
    return (
      <span className="flex-none text-[10.5px] font-extrabold px-2.25 py-1 rounded-full bg-logro-fondo text-logro">
        ACTIVA
      </span>
    );
  }
  return (
    <span className="flex-none text-[10.5px] font-extrabold px-2.25 py-1 rounded-full bg-[#F7E7A6] text-[#9A7B1E]">
      PENDIENTE
    </span>
  );
}
