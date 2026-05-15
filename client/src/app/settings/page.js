"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI, graphAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import {
  Settings as SettingsIcon,
  User,
  Zap,
  Clock,
  Info,
  Calendar,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo } from "react";

/* ── Tech badge color mapping ── */
const TECH_COLORS = {
  javascript: { bg: "rgba(234,179,8,0.15)", border: "rgba(234,179,8,0.3)", text: "#eab308" },
  express: { bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.15)", text: "rgba(255,255,255,0.8)" },
  debugging: { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)", text: "#ef4444" },
  backend: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.25)", text: "#3b82f6" },
  performance: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.25)", text: "#10b981" },
};

function getTechColor(name) {
  const key = name?.toLowerCase();
  return TECH_COLORS[key] || {
    bg: "var(--color-bg-elevated)",
    border: "var(--color-border)",
    text: "var(--color-text-secondary)",
  };
}

/* ── Accordion Card ── */
function AccordionCard({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-accordion">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 text-left"
        style={{
          padding: "16px 24px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          transition: "background 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(139,92,246,0.03)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(139,92,246,0.1)",
          }}
        >
          <Icon size={18} style={{ color: "#8b5cf6" }} />
        </div>
        <span
          style={{
            flex: 1,
            fontSize: 17,
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />
        )}
      </button>
      <div
        style={{
          overflow: "hidden",
          maxHeight: open ? 1200 : 0,
          opacity: open ? 1 : 0,
          transition: "max-height 400ms ease, opacity 300ms ease",
        }}
      >
        <div style={{ padding: "0 24px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

/* ── Heatmap Cell ── */
function HeatmapCell({ count, date }) {
  const [hovered, setHovered] = useState(false);

  const intensity = count === 0
    ? "var(--color-bg-elevated)"
    : count === 1
    ? "rgba(139,92,246,0.3)"
    : count <= 3
    ? "rgba(139,92,246,0.55)"
    : "rgba(139,92,246,0.9)";

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 3,
          background: intensity,
          cursor: "pointer",
        }}
      />
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 6,
            padding: "4px 8px",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-secondary)",
            whiteSpace: "nowrap",
            zIndex: 10,
            marginBottom: 4,
            pointerEvents: "none",
          }}
        >
          {count} note{count !== 1 ? "s" : ""} on {date}
        </div>
      )}
    </div>
  );
}

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

  // Build heatmap data from timeline
  const heatmapData = useMemo(() => {
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;
    const grid = [];

    // Build a date -> count map from timeline data
    const dateMap = {};
    if (stats?.timeline) {
      stats.timeline.forEach((t) => {
        // Timeline has month-level data, distribute across days
        const [year, month] = t.month.split("-");
        const daysInMonth = new Date(year, month, 0).getDate();
        const countPerDay = Math.ceil(t.count / daysInMonth);
        for (let d = 1; d <= daysInMonth; d++) {
          const dateStr = `${year}-${month.padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          dateMap[dateStr] = (dateMap[dateStr] || 0) + countPerDay;
        }
      });
    }

    // Generate grid
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split("T")[0];
      grid.push({
        date: dateStr,
        count: dateMap[dateStr] || 0,
        dayOfWeek: date.getDay(),
      });
    }

    // Group by weeks
    const weekGroups = [];
    for (let i = 0; i < grid.length; i += 7) {
      weekGroups.push(grid.slice(i, i + 7));
    }

    return { grid, weekGroups, totalNotes: grid.reduce((s, d) => s + d.count, 0) };
  }, [stats?.timeline]);

  return (
    <div className="space-y-6" style={{ maxWidth: 720 }}>
      <div>
        <h1
          className="page-heading flex items-center gap-2"
          style={{ fontSize: 28 }}
        >
          <SettingsIcon size={22} className="heading-icon" style={{ color: "#8b5cf6" }} /> Settings
        </h1>
        <p
          className="page-subtitle"
          style={{ fontSize: 15, color: "var(--color-text-secondary)", marginTop: 4 }}
        >
          Configuration engine
        </p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <AccordionCard icon={User} title="Profile" defaultOpen>
          <div className="flex items-center gap-5 mb-5">
            {/* Avatar */}
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 16,
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
                transition: "transform 200ms ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, color: "white" }}>
                {user?.name}
              </p>
              <p
                style={{
                  fontSize: 14,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-muted)",
                }}
              >
                {user?.email}
              </p>
              <p
                className="flex items-center gap-1"
                style={{
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  marginTop: 4,
                }}
              >
                <Calendar size={12} />
                Member since{" "}
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>
          {/* Divider */}
          <div style={{ height: 1, background: "var(--color-border)", margin: "16px 0" }} />
          <button onClick={logout} className="btn-danger">
            Sign Out
          </button>
        </AccordionCard>

        {/* Developer Patterns */}
        {patterns && (
          <AccordionCard icon={Zap} title="Developer Patterns">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Top Technologies */}
              <div
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    marginBottom: 12,
                  }}
                >
                  Top Technologies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.topTech
                    ?.sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((t) => {
                      const tc = getTechColor(t.name);
                      const maxCount = Math.max(...(patterns.topTech?.map((x) => x.count) || [1]));
                      return (
                        <div key={t.name} style={{ width: "100%" }}>
                          <div
                            className="flex items-center justify-between"
                            style={{
                              background: tc.bg,
                              border: `1px solid ${tc.border}`,
                              borderRadius: 20,
                              padding: "5px 12px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 500,
                              color: tc.text,
                            }}
                          >
                            <span>{t.name}</span>
                            <span
                              style={{
                                background: "var(--color-accent-primary)",
                                color: "white",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {t.count}
                            </span>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", borderRadius: 2, background: tc.text, width: `${(t.count / maxCount) * 100}%`, transition: "width 600ms ease" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Note Types */}
              <div
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    marginBottom: 12,
                  }}
                >
                  Note Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.topCategories
                    ?.sort((a, b) => b.count - a.count)
                    .map((c) => {
                      const maxCount = Math.max(...(patterns.topCategories?.map((x) => x.count) || [1]));
                      return (
                        <div key={c.name} style={{ width: "100%" }}>
                          <div
                            className="flex items-center justify-between"
                            style={{
                              background: "rgba(59,130,246,0.08)",
                              border: "1px solid rgba(59,130,246,0.2)",
                              borderRadius: 20,
                              padding: "5px 12px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#3b82f6",
                            }}
                          >
                            <span>{c.name}</span>
                            <span
                              style={{
                                background: "var(--color-accent-primary)",
                                color: "white",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {c.count}
                            </span>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", borderRadius: 2, background: "#3b82f6", width: `${(c.count / maxCount) * 100}%`, transition: "width 600ms ease" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Languages */}
              <div
                style={{
                  background: "var(--color-bg-elevated)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <h4
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-text-muted)",
                    marginBottom: 12,
                  }}
                >
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patterns.topLanguages
                    ?.sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((l) => {
                      const maxCount = Math.max(...(patterns.topLanguages?.map((x) => x.count) || [1]));
                      return (
                        <div key={l.name} style={{ width: "100%" }}>
                          <div
                            className="flex items-center justify-between"
                            style={{
                              background: "rgba(16,185,129,0.08)",
                              border: "1px solid rgba(16,185,129,0.2)",
                              borderRadius: 20,
                              padding: "5px 12px",
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 500,
                              color: "#10b981",
                            }}
                          >
                            <span>{l.name}</span>
                            <span
                              style={{
                                background: "var(--color-accent-primary)",
                                color: "white",
                                borderRadius: "50%",
                                width: 20,
                                height: 20,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 600,
                              }}
                            >
                              {l.count}
                            </span>
                          </div>
                          <div style={{ height: 3, background: "rgba(255,255,255,0.04)", borderRadius: 2, marginTop: 4 }}>
                            <div style={{ height: "100%", borderRadius: 2, background: "#10b981", width: `${(l.count / maxCount) * 100}%`, transition: "width 600ms ease" }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </AccordionCard>
        )}

        {/* Knowledge Timeline — Heatmap */}
        <AccordionCard icon={Clock} title="Knowledge Timeline">
          {heatmapData.totalNotes > 0 || stats?.timeline?.length > 0 ? (
            <div>
              {/* Month labels */}
              <div style={{ display: "flex", gap: 3, marginBottom: 4, paddingLeft: 32 }}>
                {heatmapData.weekGroups.map((week, wi) => {
                  const firstDay = new Date(week[0]?.date);
                  const showLabel = wi % 4 === 0;
                  return (
                    <div key={wi} style={{ width: 14, textAlign: "center" }}>
                      {showLabel && (
                        <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                          {firstDay.toLocaleString("default", { month: "short" })}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Grid */}
              <div style={{ display: "flex", gap: 3 }}>
                {/* Day labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 0 }}>
                  {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                    <div key={i} style={{ height: 14, fontSize: 11, color: "var(--color-text-muted)", display: "flex", alignItems: "center", width: 26 }}>
                      {label}
                    </div>
                  ))}
                </div>
                {/* Weeks */}
                {heatmapData.weekGroups.map((week, wi) => (
                  <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {[0, 1, 2, 3, 4, 5, 6].map((dow) => {
                      const day = week.find((d) => d.dayOfWeek === dow);
                      if (!day) return <div key={dow} style={{ width: 14, height: 14 }} />;
                      return <HeatmapCell key={dow} count={day.count} date={day.date} />;
                    })}
                  </div>
                ))}
              </div>
              {/* Summary */}
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 12 }}>
                {heatmapData.totalNotes} notes in the last 12 weeks
                {heatmapData.grid.some((d) => d.count > 0) && (
                  <> · Most active: {heatmapData.grid.reduce((max, d) => d.count > max.count ? d : max, { count: 0 }).date}</>
                )}
              </p>
            </div>
          ) : (
            <div>
              {/* Empty heatmap */}
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                {Array.from({ length: 84 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: "var(--color-bg-elevated)",
                    }}
                  />
                ))}
              </div>
              <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 12 }}>
                Start adding notes to track your activity
              </p>
            </div>
          )}
        </AccordionCard>

        {/* About DevGraph */}
        <AccordionCard icon={Info} title="About DevGraph">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p
              style={{
                fontSize: 14,
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              DevGraph is your personal developer knowledge graph — capture, search,
              connect, and share programming knowledge. 100% free, no paid APIs.
            </p>
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                }}
              >
                v2.0.0
              </span>
            </div>
            {/* Tech stack badges */}
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Next.js", icon: "▲" },
                { name: "Supabase", icon: "⚡" },
                { name: "Express", icon: "🚀" },
              ].map((tech) => (
                <span
                  key={tech.name}
                  style={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 20,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-secondary)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {tech.icon} {tech.name}
                </span>
              ))}
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{ width: "fit-content", fontSize: 13 }}
            >
              <ExternalLink size={14} /> GitHub
            </a>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>
              Solve it once. Remember it forever.
            </p>
          </div>
        </AccordionCard>
      </div>
    </div>
  );
}
