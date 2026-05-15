"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI, tagsAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CATEGORY_MAP } from "@/lib/constants";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Tag,
  Globe,
  Lock,
  TrendingUp,
  Plus,
  Clock,
  Zap,
  ArrowRight,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { SkeletonStatCard, SkeletonNoteRow } from "@/components/ui/Skeleton";

/* ── Category icon colors for note rows ── */
const CATEGORY_ICON_COLORS = {
  "bug-fix": "#ef4444",
  snippet: "#8b5cf6",
  command: "#10b981",
  learning: "#3b82f6",
  config: "#f59e0b",
  architecture: "#f97316",
  other: "#6b7280",
};

/* ── Category accent colors for stat card gradients ── */
const STAT_CARD_COLORS = {
  total: { accent: "#8b5cf6", gradient: "rgba(139,92,246,0.08)" },
  public: { accent: "#10b981", gradient: "rgba(16,185,129,0.08)" },
  private: { accent: "#ec4899", gradient: "rgba(236,72,153,0.08)" },
  tags: { accent: "#f59e0b", gradient: "rgba(245,158,11,0.08)" },
};

/* ── Count-up hook ── */
function useCountUp(target, duration = 800) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (target === undefined || target === null) return;
    const end = Number(target) || 0;
    if (end === 0) { setCount(0); return; }
    const start = 0;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [target, duration]);

  return count;
}

/* ── Animated bar for categories ── */
function AnimatedBar({ percentage, color, delay = 0 }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(percentage), delay + 100);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div
      style={{
        width: "100%",
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,0.04)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 3,
          background: color,
          width: `${width}%`,
          transition: "width 800ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      />
    </div>
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

  const totalCount = useCountUp(stats?.total);
  const publicCount = useCountUp(stats?.publicCount);
  const privateCount = useCountUp(stats?.privateCount);
  const tagsCount = useCountUp(stats?.topTags?.length);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 10 }} />
        <div className="skeleton" style={{ width: 250, height: 16, borderRadius: 6, marginTop: 8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          {[...Array(4)].map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 skeleton-card" style={{ padding: 0 }}>
            {[...Array(4)].map((_, i) => <SkeletonNoteRow key={i} />)}
          </div>
          <div className="space-y-6">
            <div className="skeleton-card skeleton" style={{ height: 160 }} />
            <div className="skeleton-card skeleton" style={{ height: 200 }} />
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      key: "total",
      label: "Total Notes",
      value: totalCount,
      icon: FileText,
      accent: STAT_CARD_COLORS.total,
    },
    {
      key: "public",
      label: "Public Notes",
      value: publicCount,
      icon: Globe,
      accent: STAT_CARD_COLORS.public,
    },
    {
      key: "private",
      label: "Private Notes",
      value: privateCount,
      icon: Lock,
      accent: STAT_CARD_COLORS.private,
    },
    {
      key: "tags",
      label: "Top Tags",
      value: tagsCount,
      icon: TrendingUp,
      accent: STAT_CARD_COLORS.tags,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: "white",
              fontFamily: "var(--font-body)",
              animation: "fadeIn 0.5s ease forwards",
            }}
          >
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--color-text-secondary)",
              marginTop: 4,
            }}
          >
            Your knowledge graph at a glance
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <Plus size={16} /> New Note
        </Link>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        {statCards.map((s) => (
          <div
            key={s.key}
            className="card"
            style={{
              height: 120,
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Gradient overlay top-right */}
            <div
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                borderRadius: "0 14px 0 40px",
                background: `radial-gradient(circle at top right, ${s.accent.gradient}, transparent)`,
                pointerEvents: "none",
              }}
            />
            {/* Icon + label */}
            <div className="flex items-center gap-2" style={{ position: "relative", zIndex: 1 }}>
              <s.icon size={24} style={{ color: s.accent.accent }} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--color-text-muted)",
                }}
              >
                {s.label}
              </span>
            </div>
            {/* Value */}
            <span
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-body)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {s.value}
            </span>
            {/* Bottom colored bar */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 3,
                background: s.accent.accent,
              }}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent notes */}
        <div className="lg:col-span-2 card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <h3
              className="flex items-center gap-2"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              <Clock size={15} /> Recent Notes
            </h3>
            <Link
              href="/notes"
              className="flex items-center gap-1"
              style={{
                fontSize: 13,
                color: "var(--color-accent-primary)",
                textDecoration: "none",
              }}
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {stats?.recentNotes?.length > 0 ? (
              stats.recentNotes.map((note, index) => {
                const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
                const iconColor = CATEGORY_ICON_COLORS[note.category] || "#6b7280";
                const isLast = index === stats.recentNotes.length - 1;
                return (
                  <Link
                    key={note._id}
                    href={`/notes/${note._id}`}
                    className="list-row flex items-center gap-3 group"
                    style={{
                      padding: "14px 16px",
                      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
                      textDecoration: "none",
                    }}
                  >
                    {/* Category icon */}
                    <span style={{ color: iconColor, fontSize: 16, flexShrink: 0 }}>
                      {cat.icon}
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--color-text-primary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {note.title}
                      </p>
                      <div className="flex items-center gap-2" style={{ marginTop: 4 }}>
                        {note.tags?.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              background: "rgba(139,92,246,0.12)",
                              border: "1px solid rgba(139,92,246,0.25)",
                              borderRadius: 6,
                              padding: "2px 8px",
                              color: "var(--color-accent-secondary)",
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-muted)",
                        flexShrink: 0,
                      }}
                    >
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                    {/* Hover chevron */}
                    <ChevronRight
                      size={14}
                      style={{
                        color: "var(--color-text-muted)",
                        opacity: 0,
                        transition: "opacity 150ms ease",
                        flexShrink: 0,
                      }}
                      className="group-hover:!opacity-100"
                    />
                  </Link>
                );
              })
            ) : (
              <div className="text-center" style={{ padding: "40px 24px" }}>
                <Zap
                  size={32}
                  className="mx-auto"
                  style={{ color: "var(--color-text-muted)", marginBottom: 8 }}
                />
                <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                  No notes yet. Create your first one!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar — tags & categories */}
        <div className="space-y-6">
          {/* Top tags */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3
              className="flex items-center gap-2"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: 16,
              }}
            >
              <Tag size={15} /> Top Tags
            </h3>
            <div
              className="flex gap-2"
              style={{
                overflowX: "auto",
                flexWrap: "wrap",
                paddingBottom: 4,
              }}
            >
              {stats?.topTags?.length > 0 ? (
                stats.topTags.map((t) => (
                  <span
                    key={t.name}
                    className="flex items-center gap-1.5"
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 20,
                      padding: "6px 12px",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {t.name}
                    <span
                      style={{
                        background: "var(--color-accent-primary)",
                        color: "white",
                        borderRadius: 10,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {t.count}
                    </span>
                  </span>
                ))
              ) : (
                <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                  No tags yet
                </p>
              )}
            </div>
          </div>

          {/* Categories bar chart */}
          <div className="card" style={{ padding: "20px 24px" }}>
            <h3
              className="flex items-center gap-2"
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: 16,
              }}
            >
              <BarChart3 size={15} /> Categories
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {Object.entries(stats?.categories || {}).map(([key, count], idx) => {
                const cat = CATEGORY_MAP[key] || CATEGORY_MAP.other;
                const maxCount = Math.max(
                  ...Object.values(stats?.categories || {}).map(Number),
                  1,
                );
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        width: 90,
                        flexShrink: 0,
                      }}
                    >
                      {cat.label}
                    </span>
                    <div style={{ flex: 1 }}>
                      <AnimatedBar
                        percentage={pct}
                        color={cat.color}
                        delay={idx * 100}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-muted)",
                        width: 30,
                        textAlign: "right",
                        flexShrink: 0,
                      }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
              {Object.keys(stats?.categories || {}).length === 0 && (
                <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
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
