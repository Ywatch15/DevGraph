"use client";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import { ChevronRight } from "lucide-react";

const PUBLIC_ROUTES = ["/login", "/register", "/"];

// Map pathname to breadcrumb labels
function getBreadcrumb(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));
}

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

  const breadcrumbs = getBreadcrumb(pathname);

  return (
    <div
      className="min-h-screen"
      style={{ background: "transparent" }}
    >
      <Sidebar />

      {/* Main content area */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        {/* Sticky header */}
        <div className="sticky-header">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <span className="label-tech">DevGraph</span>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: i === breadcrumbs.length - 1
                        ? "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {crumb}
                  </span>
                </span>
              ))}
            </div>


          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">{children}</div>
      </main>

      <MobileNav />
    </div>
  );
}
