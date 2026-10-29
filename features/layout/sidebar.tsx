"use client";

import type { ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { AvisosIcon, CuentaIcon, FeedIcon, LogoutIcon, NinosIcon, PlusIcon, SunIcon } from '@/components/common/Icons'

interface NavItem {
  label: string;
  route: Route;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: "Feed", route: "/", icon: <FeedIcon /> },
  { label: "Niños", route: "/ninos", icon: <NinosIcon /> },
  { label: "Avisos", route: "/avisos", icon: <AvisosIcon /> },
  { label: "Mi cuenta", route: "/mi-cuenta", icon: <CuentaIcon /> },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-62 flex-none flex-col bg-card border-r border-borde p-4 px-4 py-6 sticky top-0 h-screen">
      <Link href="/" className="flex items-center gap-2.75 px-2 pt-1 pb-5.5">
        <div className="w-[38px] h-[38px] rounded-xl bg-linear-to-br from-[#F8C3A8] to-[#F2937A] flex items-center justify-center flex-none">
          <SunIcon />
        </div>
        <div>
          <div className="font-display font-semibold text-[17px] text-tinta leading-none">
            OpenDayCare
          </div>
          <div className="text-[11.5px] text-placeholder mt-0.5">Sala Soles</div>
        </div>
      </Link>

      <Link
        href="/crear-publicacion"
        className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl bg-gradient-to-b from-boton-top to-boton-bottom text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)] mb-[18px]"
      >
        <PlusIcon />
        Nueva publicación
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.route;
          return (
            <Link
              key={item.route}
              href={item.route}
              className={
                isActive
                  ? "flex items-center gap-3 px-3 py-[11px] rounded-xl bg-acento-claro text-acento font-extrabold text-[14.5px]"
                  : "flex items-center gap-3 px-3 py-[11px] rounded-xl bg-transparent text-nav font-semibold text-[14.5px]"
              }
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-borde pt-[14px] mt-2.5">
        <div className="flex items-center gap-[11px] px-2 py-1.5">
          <div className="w-[38px] h-[38px] rounded-full bg-avatar-usuario text-white font-display font-semibold text-base flex items-center justify-center flex-none">
            C
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-sm text-tinta">Caro Giménez</div>
            <div className="text-xs text-placeholder">Maestra · Soles</div>
          </div>
          {/* Dead link until auth lands in a future spec. */}
          <a
            href="#"
            title="Cerrar sesión"
            className="flex-none w-8 h-8 rounded-[10px] bg-fondo text-[#94887B] flex items-center justify-center"
          >
            <LogoutIcon />
          </a>
        </div>
      </div>
    </aside>
  );
}

