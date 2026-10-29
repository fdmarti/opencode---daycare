import { mockKids } from "@/data/kids/mock-kids";
import { KidProfile } from "@/components/kids/KidProfile";
import { KidNotFound } from "@/components/kids/KidNotFound";

// Prerender the 8 mock kids' profiles; any other id renders the not-found state.
export function generateStaticParams() {
  return mockKids.map((kid) => ({ id: kid.id }));
}

export default async function KidProfilePage({
  params,
}: PageProps<"/kids/[id]">) {
  const { id } = await params;
  const kid = mockKids.find((candidate) => candidate.id === id);

  if (!kid) {
    return <KidNotFound />;
  }

  return <KidProfile kid={kid} />;
}
