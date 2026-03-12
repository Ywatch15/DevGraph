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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

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
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`desktop-only fixed left-0 top-0 h-screen flex flex-col transition-all duration-300 z-40 ${
        collapsed ? "w-[68px]" : "w-[256px]"
      }`}
      style={{
        background: "rgba(10, 10, 24, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-5 h-16 border-b"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #7c3aed, #db2777)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 8L16 16L10 24" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 22L24 22" stroke="#00d4aa" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && (
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
          >
            DevGraph
          </span>
        )}
      </Link>

      {/* Section label */}
      {!collapsed && (
        <div className="px-5 pt-5 pb-2">
          <span className="label-tech" style={{ color: "var(--color-text-muted)" }}>
            Navigation
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative ${
                collapsed ? "justify-center" : ""
              }`}
              style={{
                background: isActive
                  ? "rgba(124, 58, 237, 0.08)"
                  : "transparent",
                color: isActive
                  ? "#8b5cf6"
                  : "var(--color-text-secondary)",
                transitionDuration: "0.3s",
                transitionTimingFunction: "var(--nm-spring)",
              }}
              title={collapsed ? item.label : undefined}
            >
              {/* Active indicator — right border */}
              {isActive && (
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-l-full"
                  style={{ background: "#7c3aed" }}
                />
              )}
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && (
                <span
                  className="text-sm font-semibold uppercase"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="border-t p-3"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                color: "white",
              }}
            >
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="text-sm font-medium truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {user.name}
              </p>
              <p
                className="text-sm truncate"
                style={{ color: "var(--color-text-muted)" }}
              >
                {user.email}
              </p>
            </div>
          </div>
        )}
        <div className={`flex ${collapsed ? "flex-col" : "flex-row"} gap-1`}>
          <button
            onClick={logout}
            className={`btn-ghost justify-center ${collapsed ? "w-full" : "flex-1"}`}
            title="Logout"
          >
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`btn-ghost justify-center ${collapsed ? "w-full" : "flex-1"}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
