import { Suspense } from "react";

import { KidProfileRoute } from "@/components/kids/KidProfileRoute";
import { KidProfileSkeleton } from "@/components/kids/KidProfileSkeleton";

export default async function KidProfilePage(props: PageProps<"/kids/[id]">) {
  return (
    <Suspense fallback={<KidProfileSkeleton />}>
      <KidProfileRoute params={props.params} />
    </Suspense>
  );
}