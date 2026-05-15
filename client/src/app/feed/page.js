"use client";
import { useQuery } from "@tanstack/react-query";
import { publicAPI } from "@/lib/api";
import { CATEGORY_MAP } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import Link from "next/link";
import { Globe, Copy, Check, User, ArrowRight } from "lucide-react";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function FeedPage() {
  const { user } = useAuth();
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

      <div>
        <h1
          className="page-heading flex items-center gap-2"
          style={{ fontSize: 28 }}
        >
          <Globe size={22} className="heading-icon" style={{ color: "#ec4899" }} /> Public
          Knowledge Feed
        </h1>
        <p
          className="page-subtitle"
          style={{ fontSize: 15, color: "var(--color-text-secondary)", marginTop: 4 }}
        >
          Discover solutions shared by the developer community
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} height={180} />
          ))}
        </div>
      ) : notes.length > 0 ? (
        <div className="space-y-4 max-w-3xl">
          {notes.map((note) => {
            const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
            return (
              <article key={note._id} className="card" style={{ padding: "20px 24px" }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 18 }}>{cat.icon}</span>
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {note.title}
                    </h2>
                  </div>
                  <span className="badge badge-green">{cat.label}</span>
                </div>

                {note.description && (
                  <p
                    style={{
                      fontSize: 14,
                      marginBottom: 12,
                      lineHeight: 1.6,
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {note.description}
                  </p>
                )}

                {note.codeSnippet && (
                  <div className="relative" style={{ marginBottom: 12 }}>
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
                        lineHeight: 1.5,
                      }}
                    >
                      {note.codeSnippet}
                    </pre>
                    {user && (
                      <button
                        onClick={() => copySnippet(note.codeSnippet, note._id)}
                        className="btn-ghost-sm"
                        style={{ position: "absolute", top: 8, right: 8 }}
                      >
                        {copiedId === note._id ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    )}
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
                    className="flex items-center gap-2"
                    style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
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
        <div className="card text-center" style={{ padding: "48px 24px", maxWidth: 480, margin: "0 auto" }}>
          <Globe
            size={40}
            className="mx-auto"
            style={{ color: "var(--color-text-muted)", marginBottom: 12 }}
          />
          <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            No public notes yet. Be the first to share!
          </p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-secondary"
            style={{ fontSize: 14 }}
          >
            Previous
          </button>
          <span
            style={{ fontSize: 14, color: "var(--color-text-muted)", padding: "0 12px" }}
          >
            {page} / {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="btn-secondary"
            style={{ fontSize: 14 }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
