"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI, tagsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_MAP } from "@/lib/constants";
import Link from "next/link";
import {
  FileText,
  Tag,
  Globe,
  TrendingUp,
  Plus,
  Clock,
  Zap,
  ArrowRight,
  BarChart3,
  Activity,
} from "lucide-react";

/* SVG Progress Ring */
function ProgressRing({ value, max, size = 44, strokeWidth = 4, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? value / max : 0;
  const offset = circumference * (1 - pct);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        className="progress-ring-bg"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="progress-ring-fill"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => notesAPI.getStats().then((r) => r.data),
  });

  const { data: popularTags } = useQuery({
    queryKey: ["popularTags"],
    queryFn: () => tagsAPI.getPopular(10).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="h-8 w-48 rounded-xl shimmer"
          style={{ background: "var(--color-bg-tertiary)" }}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-32 shimmer" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Notes",
      value: stats?.total || 0,
      icon: FileText,
      color: "#7c3aed",
      showRing: true,
    },
    {
      label: "Public Notes",
      value: stats?.publicCount || 0,
      icon: Globe,
      color: "#db2777",
      showDot: true,
    },
    {
      label: "Private Notes",
      value: stats?.privateCount || 0,
      icon: Tag,
      color: "#f59e0b",
    },
    {
      label: "Top Tags",
      value: stats?.topTags?.length || 0,
      icon: TrendingUp,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="space-y-8 animate-springIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
          >
            <Activity size={22} style={{ color: "#7c3aed" }} /> Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your knowledge graph at a glance
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <Plus size={16} /> New Note
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        {statCards.map((s, i) => (
          <div
            key={i}
            className="card p-5 animate-springIn"
            style={{ borderRadius: "1.5rem" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}15` }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              {s.showRing && (
                <ProgressRing
                  value={stats?.total || 0}
                  max={Math.max(stats?.total || 1, 50)}
                  color={s.color}
                />
              )}
              {s.showDot && (
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse-dot"
                    style={{ background: "#10b981" }}
                  />
                  <span className="text-sm" style={{ color: "#10b981" }}>Live</span>
                </div>
              )}
            </div>
            <span
              className="text-3xl font-semibold block"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            >
              {s.value}
            </span>
            <span className="label-tech mt-1 block">
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent notes */}
        <div className="lg:col-span-2 card p-0 overflow-hidden" style={{ borderRadius: "1.5rem" }}>
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3
              className="font-semibold text-sm flex items-center gap-2"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            >
              <Clock size={15} /> Recent Notes
            </h3>
            <Link
              href="/notes"
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: "var(--color-accent)" }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div
            className="divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            {stats?.recentNotes?.length > 0 ? (
              stats.recentNotes.map((note) => {
                const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
                return (
                  <Link
                    key={note._id}
                    href={`/notes/${note._id}`}
                    className="flex items-center gap-3 px-6 py-3.5 transition-all hover:bg-[var(--color-bg-hover)]"
                    style={{ transitionTimingFunction: "var(--nm-spring)" }}
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {note.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {note.tags?.slice(0, 3).map((t) => (
                          <span key={t} className="badge badge-accent">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className="text-sm flex-shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="px-6 py-10 text-center">
                <Zap
                  size={32}
                  className="mx-auto mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No notes yet. Create your first one!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — tags & categories */}
        <div className="space-y-6 stagger-children">
          {/* Top tags */}
          <div className="card p-6 animate-springIn" style={{ borderRadius: "1.5rem" }}>
            <h3
              className="font-semibold text-sm flex items-center gap-2 mb-4"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            >
              <Tag size={15} /> Top Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {stats?.topTags?.length > 0 ? (
                stats.topTags.map((t) => (
                  <span key={t.name} className="badge badge-accent">
                    {t.name} <span className="ml-1 opacity-60">{t.count}</span>
                  </span>
                ))
              ) : (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="card p-6 animate-springIn" style={{ borderRadius: "1.5rem" }}>
            <h3
              className="font-semibold text-sm flex items-center gap-2 mb-4"
              style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
            >
              <BarChart3 size={15} /> Categories
            </h3>
            <div className="space-y-3">
              {Object.entries(stats?.categories || {}).map(([key, count]) => {
                const cat = CATEGORY_MAP[key] || CATEGORY_MAP.other;
                const pct =
                  stats?.total > 0
                    ? Math.round((count / stats.total) * 100)
                    : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-sm">
                    <span>{cat.icon}</span>
                    <span
                      className="flex-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {cat.label}
                    </span>
                    <div
                      className="w-24 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: cat.color,
                          transitionTimingFunction: "var(--nm-spring)",
                        }}
                      />
                    </div>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {count}
                    </span>
                  </div>
                );
              })}
              {Object.keys(stats?.categories || {}).length === 0 && (
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No categories yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
