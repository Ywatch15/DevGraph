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
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { useState } from "react";

function AccordionCard({ icon: Icon, title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-accordion animate-springIn">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-7 py-5 text-left transition-colors hover:bg-[rgba(255,255,255,0.02)]"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(124,58,237,0.1)" }}
        >
          <Icon size={20} style={{ color: "#7c3aed" }} />
        </div>
        <span
          className="flex-1 font-semibold text-sm"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
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
        className="overflow-hidden transition-all"
        style={{
          maxHeight: open ? "800px" : "0px",
          opacity: open ? 1 : 0,
          transitionDuration: "0.4s",
          transitionTimingFunction: "var(--nm-spring)",
        }}
      >
        <div className="px-7 pb-6 pt-0">{children}</div>
      </div>
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

  return (
    <div className="space-y-6 animate-springIn max-w-3xl">
      <div>
        <h1
          className="text-2xl font-semibold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
        >
          <SettingsIcon size={22} style={{ color: "#7c3aed" }} />{" "}
          Settings
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
          Configuration engine
        </p>
      </div>

      <div className="space-y-4 stagger-children">
        {/* Profile */}
        <AccordionCard icon={User} title="Profile" defaultOpen>
          <div className="flex items-center gap-5 mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #db2777)",
                color: "white",
              }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p
                className="font-semibold"
                style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
              >
                {user?.name}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {user?.email}
              </p>
              <p
                className="text-sm mt-1"
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
        </AccordionCard>

        {/* Activity patterns */}
        {patterns && (
          <AccordionCard icon={Zap} title="Developer Patterns">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Top technologies */}
              <div>
                <h4 className="label-tech mb-3">
                  Top Technologies
                </h4>
                <div className="space-y-2">
                  {patterns.topTech?.slice(0, 5).map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between text-sm"
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
                <h4 className="label-tech mb-3">
                  Note Types
                </h4>
                <div className="space-y-2">
                  {patterns.topCategories?.map((c) => (
                    <div
                      key={c.name}
                      className="flex items-center justify-between text-sm"
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
                <h4 className="label-tech mb-3">
                  Languages
                </h4>
                <div className="space-y-2">
                  {patterns.topLanguages?.slice(0, 5).map((l) => (
                    <div
                      key={l.name}
                      className="flex items-center justify-between text-sm"
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
          </AccordionCard>
        )}

        {/* Knowledge timeline */}
        {stats?.timeline?.length > 0 && (
          <AccordionCard icon={Clock} title="Knowledge Timeline">
            <div className="flex items-end gap-1.5 h-36">
              {stats.timeline.map((t) => {
                const maxCount = Math.max(...stats.timeline.map((x) => x.count));
                const height = maxCount > 0 ? (t.count / maxCount) * 100 : 0;
                return (
                  <div
                    key={t.month}
                    className="flex-1 flex flex-col items-center justify-end gap-1"
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "#7c3aed" }}
                    >
                      {t.count}
                    </span>
                    <div
                      className="w-full rounded-t-lg transition-all duration-700"
                      style={{
                        height: `${Math.max(height, 4)}%`,
                        background: "linear-gradient(to top, #7c3aed, #db2777)",
                        minHeight: "4px",
                        transitionTimingFunction: "var(--nm-spring)",
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
          </AccordionCard>
        )}

        {/* App info */}
        <AccordionCard icon={Info} title="About DevGraph">
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            DevGraph is your personal developer knowledge graph — capture, search,
            connect, and share programming knowledge. 100% free, no paid APIs.
            Built with Next.js, Express, and MongoDB.
          </p>
        </AccordionCard>
      </div>
    </div>
  );
}
