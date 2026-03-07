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
} from "lucide-react";

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
      <div className="p-6 md:p-8 space-y-6">
        <div
          className="h-8 w-48 rounded shimmer"
          style={{ background: "var(--color-bg-tertiary)" }}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-28 shimmer" />
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
      color: "var(--color-accent)",
    },
    {
      label: "Public Notes",
      value: stats?.publicCount || 0,
      icon: Globe,
      color: "var(--color-accent2)",
    },
    {
      label: "Private Notes",
      value: stats?.privateCount || 0,
      icon: Tag,
      color: "var(--color-warning)",
    },
    {
      label: "Top Tags",
      value: stats?.topTags?.length || 0,
      icon: TrendingUp,
      color: "var(--color-info)",
    },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Welcome back, {user?.name?.split(" ")[0]} 👋
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <s.icon size={20} style={{ color: s.color }} />
              <span
                className="text-2xl font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {s.value}
              </span>
            </div>
            <p
              className="text-xs font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent notes */}
        <div className="lg:col-span-2 card p-0 overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h3
              className="font-semibold text-sm flex items-center gap-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Clock size={15} /> Recent Notes
            </h3>
            <Link
              href="/notes"
              className="text-xs font-medium flex items-center gap-1"
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
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--color-bg-hover)]"
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
                      className="text-xs flex-shrink-0"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </Link>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center">
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
        <div className="space-y-6">
          {/* Top tags */}
          <div className="card p-5">
            <h3
              className="font-semibold text-sm flex items-center gap-2 mb-4"
              style={{ color: "var(--color-text-primary)" }}
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
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="card p-5">
            <h3
              className="font-semibold text-sm flex items-center gap-2 mb-4"
              style={{ color: "var(--color-text-primary)" }}
            >
              <BarChart3 size={15} /> Categories
            </h3>
            <div className="space-y-2">
              {Object.entries(stats?.categories || {}).map(([key, count]) => {
                const cat = CATEGORY_MAP[key] || CATEGORY_MAP.other;
                const pct =
                  stats?.total > 0
                    ? Math.round((count / stats.total) * 100)
                    : 0;
                return (
                  <div key={key} className="flex items-center gap-3 text-xs">
                    <span>{cat.icon}</span>
                    <span
                      className="flex-1"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {cat.label}
                    </span>
                    <div
                      className="w-20 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--color-bg-tertiary)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: cat.color }}
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
                  className="text-xs"
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
