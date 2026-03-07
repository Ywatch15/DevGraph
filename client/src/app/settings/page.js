"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI, graphAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  BarChart3,
  Zap,
  Clock,
  Code2,
} from "lucide-react";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => notesAPI.getStats().then((r) => r.data),
  });

  const { data: patterns } = useQuery({
    queryKey: ["patterns"],
    queryFn: () => graphAPI.getPatterns().then((r) => r.data),
  });

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fadeIn max-w-3xl">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <SettingsIcon size={24} style={{ color: "var(--color-accent)" }} />{" "}
          Settings
        </h1>
      </div>

      {/* Profile */}
      <div className="card p-6">
        <h2
          className="font-semibold text-sm flex items-center gap-2 mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          <User size={15} /> Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent), #6b4ce6)",
              color: "white",
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p
              className="font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {user?.name}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              {user?.email}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Member since{" "}
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>
        <button onClick={logout} className="btn-danger">
          Sign Out
        </button>
      </div>

      {/* Activity patterns */}
      {patterns && (
        <div className="card p-6">
          <h2
            className="font-semibold text-sm flex items-center gap-2 mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Zap size={15} /> Developer Patterns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Top technologies */}
            <div>
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Top Technologies
              </h4>
              <div className="space-y-1.5">
                {patterns.topTech?.slice(0, 5).map((t) => (
                  <div
                    key={t.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {t.name}
                    </span>
                    <span className="badge badge-accent">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Top categories */}
            <div>
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Note Types
              </h4>
              <div className="space-y-1.5">
                {patterns.topCategories?.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {c.name}
                    </span>
                    <span className="badge badge-blue">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Top languages */}
            <div>
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Languages
              </h4>
              <div className="space-y-1.5">
                {patterns.topLanguages?.slice(0, 5).map((l) => (
                  <div
                    key={l.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {l.name}
                    </span>
                    <span className="badge badge-green">{l.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge timeline */}
      {stats?.timeline?.length > 0 && (
        <div className="card p-6">
          <h2
            className="font-semibold text-sm flex items-center gap-2 mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            <Clock size={15} /> Knowledge Timeline
          </h2>
          <div className="flex items-end gap-1 h-32">
            {stats.timeline.map((t) => {
              const maxCount = Math.max(...stats.timeline.map((x) => x.count));
              const height = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
              return (
                <div
                  key={t.month}
                  className="flex-1 flex flex-col items-center justify-end gap-1"
                >
                  <span
                    className="text-[9px] font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {t.count}
                  </span>
                  <div
                    className="w-full rounded-t-sm"
                    style={{
                      height: `${Math.max(height, 4)}%`,
                      background: "var(--color-accent)",
                      minHeight: "4px",
                    }}
                  />
                  <span
                    className="text-[8px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t.month.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* App info */}
      <div className="card p-6">
        <h2
          className="font-semibold text-sm mb-3"
          style={{ color: "var(--color-text-primary)" }}
        >
          About DevGraph
        </h2>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          DevGraph is your personal developer knowledge graph — capture, search,
          connect, and share programming knowledge. 100% free, no paid APIs.
          Built with Next.js, Express, and MongoDB.
        </p>
      </div>
    </div>
  );
}
