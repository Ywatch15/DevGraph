"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Plus, GitFork, User } from "lucide-react";

const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notes/new", label: "Create", icon: Plus, special: true },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/settings", label: "Profile", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(5,5,9,0.85)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {MOBILE_TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname?.startsWith(tab.href + "/");
          const Icon = tab.icon;

          if (tab.special) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center glow-accent"
                  style={{
                    background:
                      "linear-gradient(135deg, #7c3aed, #db2777)",
                  }}
                >
                  <Icon size={22} color="white" />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-accent-hover)" }}
                >
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-1 py-1 px-3"
            >
              <Icon
                size={20}
                style={{
                  color: isActive
                    ? "var(--color-accent-hover)"
                    : "var(--color-text-muted)",
                }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  color: isActive
                    ? "var(--color-accent-hover)"
                    : "var(--color-text-muted)",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
