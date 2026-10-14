import { ReleaseSpotForm } from "@/components/forms/ReleaseSpotForm";
import { BottomNav } from "@/components/ui/BottomNav";
import { AuthGuard } from "@/components/ui/AuthGuard";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ReleasePage() {
  return (
    <AuthGuard>
      <div className="fixed inset-0 flex flex-col bg-bg overflow-y-auto">
        <header className="pt-safe flex items-center gap-3 px-4 py-4 border-b border-base sticky top-0 bg-bg z-10">
          <Link href="/dashboard" className="text-muted hover:text-base">
            <ChevronLeft size={22} />
          </Link>
          <div>
            <h1 className="font-display font-bold text-lg">Liberar mi aparcamiento</h1>
            <p className="text-muted text-xs mt-0.5">Gana puntos ayudando a otros conductores</p>
          </div>
        </header>
        <main className="flex-1 pb-24"><ReleaseSpotForm /></main>
        <BottomNav />
      </div>
    </AuthGuard>
  );
}
