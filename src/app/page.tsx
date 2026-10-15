"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RootPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "authenticated") {
      router.replace("/dashboard");
    } else {
      router.replace("/auth/signin");
    }
  }, [status, router]);

  // Pantalla de carga mientras decide a dónde ir
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl">🅿️</div>
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    </div>
  );
}