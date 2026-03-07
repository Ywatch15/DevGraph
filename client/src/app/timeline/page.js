"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI } from "@/lib/api";
import { CATEGORY_MAP } from "@/lib/constants";
import Link from "next/link";
import { Clock, TrendingUp, Calendar } from "lucide-react";

export default function TimelinePage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: () => notesAPI.getStats().then((r) => r.data),
  });

  const { data: notesData } = useQuery({
    queryKey: ["allNotes"],
    queryFn: () =>
      notesAPI.getAll({ limit: 100, sort: "-createdAt" }).then((r) => r.data),
  });

  const notes = notesData?.notes || [];
  const timeline = stats?.timeline || [];

  // Group notes by month
  const grouped = {};
  for (const note of notes) {
    const date = new Date(note.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(note);
  }

  const months = Object.keys(grouped).sort().reverse();

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fadeIn max-w-3xl">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <Clock size={24} style={{ color: "var(--color-accent)" }} /> Knowledge
          Timeline
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          Your developer learning journey over time
        </p>
      </div>

      {/* Growth chart */}
      {timeline.length > 0 && (
        <div className="card p-6">
          <h3
            className="text-sm font-semibold flex items-center gap-2 mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            <TrendingUp size={14} /> Growth
          </h3>
          <div className="flex items-end gap-2 h-24">
            {timeline.map((t) => {
              const max = Math.max(...timeline.map((x) => x.count));
              const h = max > 0 ? (t.count / max) * 100 : 0;
              return (
                <div
                  key={t.month}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {t.count}
                  </span>
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{
                      height: `${Math.max(h, 5)}%`,
                      background:
                        "linear-gradient(to top, var(--color-accent), var(--color-accent2))",
                      minHeight: "4px",
                    }}
                  />
                  <span
                    className="text-[9px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {t.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Timeline entries */}
      {isLoading ? (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 shimmer rounded-lg"
              style={{ background: "var(--color-bg-tertiary)" }}
            />
          ))}
        </div>
      ) : months.length > 0 ? (
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-4 top-0 bottom-0 w-0.5"
            style={{ background: "var(--color-border)" }}
          />

          {months.map((month) => (
            <div key={month} className="relative pl-12 pb-8">
              {/* Dot */}
              <div
                className="absolute left-[11px] top-1 w-3 h-3 rounded-full glow-accent"
                style={{ background: "var(--color-accent)" }}
              />

              <div className="flex items-center gap-2 mb-3">
                <Calendar size={14} style={{ color: "var(--color-accent)" }} />
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {new Date(month + "-01").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </h3>
                <span className="badge badge-accent">
                  {grouped[month].length} notes
                </span>
              </div>

              <div className="space-y-2">
                {grouped[month].map((note) => {
                  const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
                  return (
                    <Link
                      key={note._id}
                      href={`/notes/${note._id}`}
                      className="card card-interactive p-3 flex items-center gap-3"
                    >
                      <span className="text-sm">{cat.icon}</span>
                      <span
                        className="text-sm flex-1 truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {note.title}
                      </span>
                      <div className="flex gap-1 flex-shrink-0">
                        {note.tags?.slice(0, 2).map((t) => (
                          <span
                            key={t}
                            className="badge badge-accent text-[9px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Clock
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Your timeline will appear as you create notes
          </p>
        </div>
      )}
    </div>
  );
}
