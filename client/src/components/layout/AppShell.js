"use client";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import CommandPalette from "./CommandPalette";

const PUBLIC_ROUTES = ["/login", "/register", "/"];

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  useEffect(() => {
    if (!loading && !user && !isPublic) {
      router.push("/login");
    }
  }, [user, loading, isPublic, router]);

  // Public pages — no sidebar
  if (isPublic) {
    return <>{children}</>;
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{
              borderColor: "var(--color-accent)",
              borderTopColor: "transparent",
            }}
          />
          <span
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading DevGraph...
          </span>
        </div>
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect
  if (!user) return null;

  return (
    <div
      className="min-h-screen"
      style={{ background: "transparent" }}
    >
      <Sidebar />
      <CommandPalette />

      {/* Main content area */}
      <main className="md:ml-60 min-h-screen pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>

      <MobileNav />
    </div>
  );
}
