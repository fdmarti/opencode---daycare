import { Sidebar } from "@/features/layout/sidebar";

// Shared shell for every screen of the app section: fixed sidebar + scrollable main.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen bg-fondo">
      <Sidebar />
      <main className="flex-1 min-w-0 h-screen overflow-y-auto">{children}</main>
    </div>
  );
}
