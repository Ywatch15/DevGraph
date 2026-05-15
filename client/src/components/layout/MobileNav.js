"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, Plus, GitFork, User } from "lucide-react";
import { useState } from "react";

const MOBILE_TABS = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/search", label: "Search", icon: Search },
  { href: "/notes/new", label: "Create", icon: Plus, special: true },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/settings", label: "Profile", icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [pressed, setPressed] = useState(null);

  return (
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 z-50"
      style={{
        height: 60,
        background: "#0d0d14",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {MOBILE_TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname?.startsWith(tab.href + "/");
          const Icon = tab.icon;
          const isPressed = pressed === tab.href;

          if (tab.special) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 -mt-4"
                onTouchStart={() => setPressed(tab.href)}
                onTouchEnd={() => setPressed(null)}
                style={{
                  transform: isPressed ? "scale(0.9)" : "scale(1)",
                  transition: "transform 100ms ease",
                }}
              >
                <div
                  className="flex items-center justify-center glow-accent"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  }}
                >
                  <Icon size={22} color="white" />
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: "var(--font-mono)",
                    fontWeight: 500,
                    color: "var(--color-accent-primary)",
                  }}
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
              onTouchStart={() => setPressed(tab.href)}
              onTouchEnd={() => setPressed(null)}
              style={{
                position: "relative",
                transform: isPressed ? "scale(0.9)" : "scale(1)",
                transition: "transform 100ms ease",
                textDecoration: "none",
              }}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: -1,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 20,
                    height: 3,
                    borderRadius: "0 0 3px 3px",
                    background: "var(--color-accent-primary)",
                  }}
                />
              )}
              <Icon
                size={22}
                style={{
                  color: isActive
                    ? "var(--color-accent-primary)"
                    : "var(--color-text-muted)",
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                  color: isActive
                    ? "var(--color-accent-primary)"
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
