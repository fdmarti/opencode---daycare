import { KidProfileSection } from "@/components/kids/KidProfileSection";

export async function KidProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <KidProfileSection kidId={id} />;
}