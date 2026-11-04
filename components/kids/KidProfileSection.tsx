"use client";

import { useEffect } from "react";

import { KidNotFound } from "@/components/kids/KidNotFound";
import { KidProfile } from "@/components/kids/KidProfile";
import { KidProfileSkeleton } from "@/components/kids/KidProfileSkeleton";
import { useKidProfileStore } from "@/stores/kid-profile-store";

export function KidProfileSection({ kidId }: { kidId: string }) {
  const child = useKidProfileStore((s) => s.child);
  const isLoading = useKidProfileStore((s) => s.isLoading);
  const error = useKidProfileStore((s) => s.error);
  const fetchKid = useKidProfileStore((s) => s.fetchKid);

  useEffect(() => {
    void fetchKid(kidId);
  }, [kidId, fetchKid]);

  if (isLoading) return <KidProfileSkeleton />;
  if (error) {
    return (
      <div className="max-w-205 w-full mx-auto px-10 pt-8.5 pb-20">
        <p className="text-[15px] text-mute">
          No se pudo cargar el perfil del niño
        </p>
      </div>
    );
  }
  if (!child) return <KidNotFound />;
  return <KidProfile child={child} />;
}