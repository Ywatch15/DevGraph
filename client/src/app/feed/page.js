"use client";
import { useQuery } from "@tanstack/react-query";
import { publicAPI } from "@/lib/api";
import { CATEGORY_MAP } from "@/lib/constants";
import { useState } from "react";
import { Globe, Copy, Check, User, ExternalLink } from "lucide-react";

export default function FeedPage() {
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["feed", page],
    queryFn: () => publicAPI.getFeed({ page, limit: 20 }).then((r) => r.data),
  });

  const notes = data?.notes || [];
  const pagination = data?.pagination || { page: 1, pages: 1 };

  const copySnippet = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fadeIn">
      <div>
        <h1
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          <Globe size={24} style={{ color: "var(--color-accent2)" }} /> Public
          Knowledge Feed
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          Discover solutions shared by the developer community
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-48 shimmer" />
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-4 max-w-3xl">
          {notes.map((note) => {
            const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
            return (
              <article key={note._id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <h2
                      className="font-semibold text-base"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {note.title}
                    </h2>
                  </div>
                  <span className="badge badge-green text-[10px]">
                    {cat.label}
                  </span>
                </div>

                {note.description && (
                  <p
                    className="text-sm mb-3 leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {note.description}
                  </p>
                )}

                {note.codeSnippet && (
                  <div className="relative mb-3">
                    <pre
                      className="rounded-lg px-4 py-3 text-xs overflow-x-auto"
                      style={{
                        background: "var(--color-bg-primary)",
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-secondary)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      {note.codeSnippet}
                    </pre>
                    <button
                      onClick={() => copySnippet(note.codeSnippet, note._id)}
                      className="absolute top-2 right-2 btn-ghost text-xs"
                    >
                      {copiedId === note._id ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags?.slice(0, 5).map((t) => (
                      <span key={t} className="badge badge-accent">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div
                    className="flex items-center gap-2 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {note.userId?.name && (
                      <span className="flex items-center gap-1">
                        <User size={11} /> {note.userId.name}
                      </span>
                    )}
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center max-w-lg mx-auto">
          <Globe
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No public notes yet. Be the first to share!
          </p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary text-xs"
          >
            Previous
          </button>
          <span
            className="text-sm px-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="btn-secondary text-xs"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
