"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useState } from "react";
import { Code2, Copy, Check, ArrowRight } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";
import { SkeletonCard } from "@/components/ui/Skeleton";

const SNIPPET_GROUPS = {
  Authentication: [
    "auth",
    "jwt",
    "oauth",
    "session",
    "bcrypt",
    "authentication",
    "authorization",
  ],
  Database: [
    "mongodb",
    "sql",
    "postgresql",
    "mysql",
    "prisma",
    "mongoose",
    "database",
    "migration",
  ],
  API: ["api", "rest", "graphql", "express", "fetch", "axios", "endpoint"],
  DevOps: [
    "docker",
    "kubernetes",
    "nginx",
    "ci",
    "cd",
    "deploy",
    "devops",
    "aws",
    "gcp",
  ],
  Frontend: [
    "react",
    "nextjs",
    "css",
    "html",
    "component",
    "hook",
    "tailwind",
    "frontend",
  ],
  Other: [],
};

export default function SnippetsPage() {
  const { user } = useAuth();
  const [filterLang, setFilterLang] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["snippets"],
    queryFn: () => notesAPI.getAll({ limit: 100 }).then((r) => r.data),
  });

  const notes = (data?.notes || []).filter((n) => n.codeSnippet);

  // Filter by language
  let filtered = filterLang
    ? notes.filter((n) => n.language === filterLang)
    : notes;

  // Filter by group
  if (filterGroup && SNIPPET_GROUPS[filterGroup]) {
    const keywords = SNIPPET_GROUPS[filterGroup];
    if (keywords.length > 0) {
      filtered = filtered.filter((n) =>
        n.tags?.some((t) => keywords.includes(t.toLowerCase())),
      );
    }
  }

  // Group snippets
  const grouped = {};
  for (const note of filtered) {
    let assignedGroup = "Other";
    for (const [group, keywords] of Object.entries(SNIPPET_GROUPS)) {
      if (group === "Other") continue;
      if (note.tags?.some((t) => keywords.includes(t.toLowerCase()))) {
        assignedGroup = group;
        break;
      }
    }
    if (!grouped[assignedGroup]) grouped[assignedGroup] = [];
    grouped[assignedGroup].push(note);
  }

  const copySnippet = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Guest banner */}
      {!user && (
        <div
          style={{
            background: "rgba(139,92,246,0.1)",
            borderBottom: "1px solid var(--color-border)",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderRadius: 12,
            gap: 16,
          }}
        >
          <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
            You&apos;re browsing as a guest — Sign up to save and create your own notes
          </span>
          <Link
            href="/register"
            className="btn-primary"
            style={{ fontSize: 13, padding: "8px 16px", flexShrink: 0 }}
          >
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="page-heading flex items-center gap-2"
            style={{ fontSize: 28 }}
          >
            <Code2 size={22} className="heading-icon" style={{ color: "#8b5cf6" }} /> Snippet
            Library
          </h1>
          <p
            className="page-subtitle"
            style={{ fontSize: 15, color: "var(--color-text-secondary)", marginTop: 4 }}
          >
            {filtered.length} snippets — grouped and ready to reuse
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="input"
            style={{ width: "auto", fontSize: 14 }}
          >
            <option value="">All Groups</option>
            {Object.keys(SNIPPET_GROUPS).map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={filterLang}
            onChange={(e) => setFilterLang(e.target.value)}
            className="input"
            style={{ width: "auto", fontSize: 14 }}
          >
            <option value="">All Languages</option>
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <SkeletonCard key={i} height={180} />
          ))}
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([group, snippets]) => (
          <div key={group}>
            <h2
              className="label-section flex items-center gap-2"
              style={{ color: "var(--color-text-secondary)", marginBottom: 12 }}
            >
              {group}
              <span
                style={{ fontSize: 14, fontWeight: 400, color: "var(--color-text-muted)" }}
              >
                ({snippets.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
              {snippets.map((note) => (
                <div key={note._id} className="card" style={{ padding: "16px 20px" }}>
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/notes/${note._id}`}
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {note.title}
                    </Link>
                    <span className="badge badge-blue">{note.language}</span>
                  </div>
                  <div className="relative">
                    <pre
                      style={{
                        background: "#0d0d14",
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                        borderRadius: 8,
                        padding: "12px 16px",
                        overflowX: "auto",
                        maxHeight: 120,
                        lineHeight: 1.5,
                      }}
                    >
                      {note.codeSnippet.slice(0, 400)}
                    </pre>
                    <button
                      onClick={() => copySnippet(note.codeSnippet, note._id)}
                      className="btn-ghost-sm"
                      style={{ position: "absolute", top: 6, right: 6 }}
                    >
                      {copiedId === note._id ? (
                        <Check size={11} />
                      ) : (
                        <Copy size={11} />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags?.slice(0, 4).map((t) => (
                      <span key={t} className="badge badge-accent">
                        {t}
                      </span>
                    ))}
                  </div>
                  {/* Guest: show sign in to save instead of save button */}
                  {!user && (
                    <Link
                      href="/login"
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 12,
                        color: "var(--color-accent-primary)",
                        textDecoration: "none",
                      }}
                    >
                      Sign in to save →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card text-center" style={{ padding: 48 }}>
          <Code2
            size={40}
            className="mx-auto"
            style={{ color: "var(--color-text-muted)", marginBottom: 12 }}
          />
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            No snippets yet. Add code to your notes!
          </p>
        </div>
      )}
    </div>
  );
}
