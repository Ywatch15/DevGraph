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
function HeatmapCell({ count, date, weekKey, maxCount = 1 }) {
  const [hovered, setHovered] = useState(false);

  // GitHub/LeetCode-style intensity: scale from 0-100%
  let intensity = "var(--color-bg-elevated)";
  if (count > 0) {
    const ratio = Math.min(count / Math.max(maxCount, 1), 1);
    if (ratio < 0.25) {
      intensity = "rgba(139,92,246,0.25)";
    } else if (ratio < 0.5) {
      intensity = "rgba(139,92,246,0.45)";
    } else if (ratio < 0.75) {
      intensity = "rgba(139,92,246,0.65)";
    } else {
      intensity = "rgba(139,92,246,0.9)";
    }
  }

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          background: intensity,
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.1)",
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
            padding: "6px 10px",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-secondary)",
            whiteSpace: "nowrap",
            zIndex: 10,
            marginBottom: 6,
            pointerEvents: "none",
          }}
        >
          {count} note{count !== 1 ? "s" : ""} • week of {date}
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

  // Build heatmap data from weekly timeline
  const heatmapData = useMemo(() => {
    const weeks = 52; // Show 52 weeks (1 year)
    
    // Build a week-number -> count map from actual weekly data
    const weekMap = {};
    if (stats?.timeline) {
      stats.timeline.forEach((t) => {
        weekMap[t.week] = Number(t.count);
      });
    }

    // Generate grid for the past 52 weeks
    const today = new Date();
    const grid = [];
    
    for (let w = weeks - 1; w >= 0; w--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7));
      const weekNumber = Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 86400000 / 7);
      const year = date.getFullYear();
      const weekKey = `${year}-${String(weekNumber).padStart(2, "0")}`;
      
      grid.push({
        weekKey,
        date: date.toISOString().split("T")[0],
        count: weekMap[weekKey] || 0,
        weekNumber,
        year,
      });
    }

    // Group by rows (7 weeks per row for better layout)
    const rows = [];
    for (let i = 0; i < grid.length; i += 7) {
      rows.push(grid.slice(i, i + 7));
    }

    const totalNotes = grid.reduce((s, w) => s + w.count, 0);
    const maxCount = Math.max(...grid.map((w) => w.count), 1);

    return { grid, rows, totalNotes, maxCount };
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
              {/* Title */}
              <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 16, fontWeight: 500 }}>
                52-week activity heatmap showing notes created per week
              </p>

              {/* Grid of weeks */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, overflowX: "auto" }}>
                {heatmapData.rows.map((row, rowIndex) => (
                  <div key={rowIndex} style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {/* Row label (month/quarter) */}
                    <div style={{ width: 40, fontSize: 10, color: "var(--color-text-muted)" }}>
                      {rowIndex % 4 === 0 && (
                        <span>
                          W{Math.max(1, heatmapData.grid.length - (rowIndex * 7) - 1)}
                        </span>
                      )}
                    </div>
                    
                    {/* Week cells */}
                    <div style={{ display: "flex", gap: 4 }}>
                      {row.map((week) => (
                        <HeatmapCell
                          key={week.weekKey}
                          count={week.count}
                          date={week.date}
                          weekKey={week.weekKey}
                          maxCount={heatmapData.maxCount}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Less</span>
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 3,
                      background: [
                        "var(--color-bg-elevated)",
                        "rgba(139,92,246,0.25)",
                        "rgba(139,92,246,0.45)",
                        "rgba(139,92,246,0.65)",
                        "rgba(139,92,246,0.9)",
                      ][level],
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>More</span>
              </div>

              {/* Summary */}
              <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 12 }}>
                {heatmapData.totalNotes} notes in the last 52 weeks
                {heatmapData.grid.some((w) => w.count > 0) && (
                  <> · Most active: Week {Math.max(...heatmapData.grid.map((w) => w.weekNumber))} ({heatmapData.grid.reduce((max, w) => w.count > max.count ? w : max, { count: 0 }).count} notes)</>
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
