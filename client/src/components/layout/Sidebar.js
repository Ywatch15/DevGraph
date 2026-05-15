"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  FileText,
  Search,
  GitFork,
  Globe,
  Tags,
  Code2,
  Settings,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/notes", label: "My Notes", icon: FileText },
  { href: "/search", label: "Search", icon: Search },
  { href: "/graph", label: "Knowledge Graph", icon: GitFork },
  { href: "/feed", label: "Public Feed", icon: Globe },
  { href: "/tags", label: "Tags", icon: Tags },
  { href: "/snippets", label: "Snippet Library", icon: Code2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside
      className="desktop-only fixed left-0 top-0 h-screen flex flex-col z-40"
      style={{
        width: 220,
        background: "#0d0d14",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3"
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
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
            letterSpacing: "-0.01em",
          }}
        >
          DevGraph
        </span>
      </Link>

      {/* Section label */}
      <div style={{ padding: "20px 16px 8px 16px" }}>
        <span
          style={{
            fontSize: 11,
            letterSpacing: "0.1em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          Navigation
        </span>
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: "4px 8px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: isActive ? "white" : "var(--color-text-secondary)",
                  background: isActive
                    ? "rgba(139,92,246,0.15)"
                    : "transparent",
                  transition: "all 150ms ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "rgba(139,92,246,0.08)";
                    e.currentTarget.style.color = "var(--color-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--color-text-secondary)";
                  }
                }}
              >
                <Icon
                  size={18}
                  className="flex-shrink-0"
                  style={{
                    color: isActive
                      ? "var(--color-accent-primary)"
                      : "inherit",
                  }}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User section */}
      <div
        style={{
          borderTop: "1px solid var(--color-border)",
          padding: 12,
        }}
      >
        {user && (
          <div
            className="flex items-center gap-3"
            style={{ padding: "4px 4px 12px 4px" }}
          >
            {/* Avatar with accent ring and online dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  color: "white",
                  fontSize: 14,
                  fontWeight: 700,
                  border: "2px solid var(--color-accent-primary)",
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              {/* Online dot */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#10b981",
                  border: "2px solid #0a0a0f",
                }}
              />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </p>
              <p
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Sign Out button */}
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "none",
            background: "transparent",
            color: "var(--color-text-muted)",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 150ms ease",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "rgba(239,68,68,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "var(--color-text-muted)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
