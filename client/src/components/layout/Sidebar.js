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
  Zap,
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
        collapsed ? "w-[68px]" : "w-[240px]"
      }`}
      style={{
        background: "var(--color-bg-secondary)",
        borderRight: "1px solid var(--color-border)",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 h-16 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--color-accent), #6b4ce6)",
          }}
        >
          <Zap size={18} color="white" />
        </div>
        {!collapsed && (
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            DevGraph
          </span>
        )}
      </Link>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group ${
                collapsed ? "justify-center" : ""
              }`}
              style={{
                background: isActive
                  ? "rgba(124, 92, 252, 0.12)"
                  : "transparent",
                color: isActive
                  ? "var(--color-accent-hover)"
                  : "var(--color-text-secondary)",
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={19} className="flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <div
                  className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--color-accent)" }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div
        className="border-t p-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-2 px-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: "var(--color-bg-tertiary)",
                color: "var(--color-accent)",
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
                className="text-xs truncate"
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
