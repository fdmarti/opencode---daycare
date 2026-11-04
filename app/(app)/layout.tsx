import { Suspense } from "react";

import { Sidebar } from "@/components/layout/Sidebar";

// Shared shell for every screen of the app section: fixed sidebar + scrollable main.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-fondo">
      <Suspense>
        <Sidebar />
      </Suspense>
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
