"use client";
import { useQuery } from "@tanstack/react-query";
import { notesAPI } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { Code2, Copy, Check, Filter } from "lucide-react";
import { LANGUAGES } from "@/lib/constants";

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
    <div className="space-y-6 animate-springIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
          >
            <Code2 size={22} style={{ color: "#7c3aed" }} /> Snippet
            Library
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {filtered.length} snippets — grouped and ready to reuse
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="input w-auto text-sm"
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
            className="input w-auto text-sm"
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
            <div key={i} className="card h-48 shimmer" />
          ))}
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        Object.entries(grouped).map(([group, snippets]) => (
          <div key={group}>
            <h2
              className="label-section mb-3 flex items-center gap-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {group}
              <span
                className="text-xs font-normal"
                style={{ color: "var(--color-text-muted)" }}
              >
                ({snippets.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
              {snippets.map((note) => (
                <div key={note._id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Link
                      href={`/notes/${note._id}`}
                      className="font-medium text-sm hover:underline"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {note.title}
                    </Link>
                    <span className="badge badge-blue text-[10px]">
                      {note.language}
                    </span>
                  </div>
                  <div className="relative">
                    <pre
                      className="rounded-md px-3 py-2 text-xs overflow-x-auto max-h-32"
                      style={{
                        background: "var(--color-bg-primary)",
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {note.codeSnippet.slice(0, 400)}
                    </pre>
                    <button
                      onClick={() => copySnippet(note.codeSnippet, note._id)}
                      className="absolute top-1.5 right-1.5 btn-ghost text-[10px]"
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
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="card p-12 text-center">
          <Code2
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No snippets yet. Add code to your notes!
          </p>
        </div>
      )}
    </div>
  );
}
