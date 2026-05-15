"use client";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import KeyboardShortcuts from "./KeyboardShortcuts";
import { ChevronRight, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Routes accessible without authentication
const PUBLIC_ROUTES = ["/", "/login", "/register", "/feed", "/snippets"];

// Routes that get the landing/auth layout (no sidebar, no top nav)
const AUTH_LAYOUT_ROUTES = ["/", "/login", "/register"];

// Map pathname to breadcrumb labels
function getBreadcrumb(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1));
}

/* ── Guest top navbar ── */
function GuestNavbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
      style={{
        height: 56,
        padding: "0 24px",
        background: "rgba(10,10,15,0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
        <div
          className="flex items-center justify-center"
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 8L16 16L10 24" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 22L24 22" stroke="#00d4aa" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontWeight: 700,
            fontSize: 16,
            color: "var(--color-text-primary)",
          }}
        >
          DevGraph
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="btn-ghost"
          style={{ padding: "8px 16px", fontSize: 14 }}
        >
          Sign In
        </Link>
        <Link href="/register" className="btn-primary" style={{ fontSize: 14 }}>
          Get Started <ArrowRight size={14} />
        </Link>
      </div>
    </header>
  );
}

/* ── Inner AppShell (uses useSearchParams) ── */
function AppShellInner({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isAuthLayoutRoute = AUTH_LAYOUT_ROUTES.includes(pathname);

  // Redirect unauthenticated users from protected routes
  useEffect(() => {
    if (!loading && !user && !isPublicRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [user, loading, isPublicRoute, router, pathname]);

  // Handle post-login redirect
  useEffect(() => {
    if (user && pathname === "/dashboard") {
      const redirectPath = searchParams?.get("redirect");
      if (redirectPath && redirectPath !== "/dashboard") {
        router.replace(redirectPath);
      }
    }
  }, [user, pathname, searchParams, router]);

  // Auth layout routes (landing, login, register) — no sidebar/navbar
  if (isAuthLayoutRoute) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Guest layout for public routes (/feed, /snippets) — show guest navbar
  if (!loading && !user && isPublicRoute) {
    return (
      <div style={{ background: "var(--color-bg-base)", minHeight: "100vh" }}>
        <GuestNavbar />
        <main style={{ paddingTop: 56 }}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Loading state — skeleton
  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
          <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 6 }} />
        </div>
      </div>
    );
  }

  // Not logged in — redirect handled by useEffect
  if (!user) return null;

  const breadcrumbs = getBreadcrumb(pathname);

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <Sidebar />
      <KeyboardShortcuts />

      {/* Main content area — offset by sidebar width 220px on desktop */}
      <main className="min-h-screen pb-20 md:pb-0" style={{ marginLeft: 220 }}>
        {/* Sticky header */}
        <div className="sticky-header desktop-only">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5">
              <span className="label-tech">DevGraph</span>
              {breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <ChevronRight size={12} style={{ color: "var(--color-text-muted)" }} />
                  <span
                    className="font-medium"
                    style={{
                      fontSize: 14,
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

        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

/* ── Exported wrapper with Suspense boundary for useSearchParams ── */
export default function AppShell({ children }) {
  return (
    <Suspense fallback={
      <div
        className="flex items-center justify-center h-screen"
        style={{ background: "var(--color-bg-base)" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
          <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 6 }} />
        </div>
      </div>
    }>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
