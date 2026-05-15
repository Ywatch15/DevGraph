"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesAPI } from "@/lib/api";
import { CATEGORY_MAP, CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Trash2, Globe, Lock, X, FileText, Grid3X3, List } from "lucide-react";
import toast from "react-hot-toast";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function NotesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notes", page, filterTag, filterCategory],
    queryFn: () =>
      notesAPI
        .getAll({
          page,
          limit: 20,
          tags: filterTag || undefined,
          category: filterCategory || undefined,
        })
        .then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => notesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted");
    },
  });

  const notes = data?.notes || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Client-side filter for search
  const filtered = search
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(search.toLowerCase()) ||
          n.tags?.some((t) => t.includes(search.toLowerCase())),
      )
    : notes;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="page-heading flex items-center gap-2"
            style={{ fontSize: 28 }}
          >
            <FileText size={22} className="heading-icon" style={{ color: "#8b5cf6" }} /> My Notes
          </h1>
          <p
            className="page-subtitle"
            style={{ fontSize: 15, color: "var(--color-text-secondary)", marginTop: 4 }}
          >
            {pagination.total} total notes
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <Plus size={16} /> New Note
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-with-icon"
            placeholder="Filter notes..."
          />
        </div>
        {/* Category segmented control */}
        <div
          className="flex gap-1"
          style={{
            background: "var(--color-bg-elevated)",
            borderRadius: 10,
            padding: 3,
            border: "1px solid var(--color-border)",
            flexShrink: 0,
            overflowX: "auto",
          }}
        >
          <button
            onClick={() => { setFilterCategory(""); setPage(1); }}
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              border: "none",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              background: !filterCategory ? "var(--color-accent-primary)" : "transparent",
              color: !filterCategory ? "white" : "var(--color-text-secondary)",
              transition: "all 150ms ease",
              whiteSpace: "nowrap",
            }}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => { setFilterCategory(filterCategory === c.value ? "" : c.value); setPage(1); }}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                background: filterCategory === c.value ? "var(--color-accent-primary)" : "transparent",
                color: filterCategory === c.value ? "white" : "var(--color-text-secondary)",
                transition: "all 150ms ease",
                whiteSpace: "nowrap",
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div className="flex gap-1" style={{ flexShrink: 0 }}>
          <button
            onClick={() => setViewMode("grid")}
            className="btn-ghost-sm"
            style={{
              background: viewMode === "grid" ? "rgba(139,92,246,0.1)" : "transparent",
              color: viewMode === "grid" ? "var(--color-accent-primary)" : "var(--color-text-muted)",
            }}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="btn-ghost-sm"
            style={{
              background: viewMode === "list" ? "rgba(139,92,246,0.1)" : "transparent",
              color: viewMode === "list" ? "var(--color-accent-primary)" : "var(--color-text-muted)",
            }}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {filterTag && (
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
            Filtered by tag:
          </span>
          <span className="badge badge-accent">
            {filterTag}
            <button onClick={() => setFilterTag("")} style={{ marginLeft: 4, background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
              <X size={10} />
            </button>
          </span>
        </div>
      )}

      {/* Notes */}
      {isLoading ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} height={180} />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-3"}>
          {filtered.map((note) => {
            const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
            return (
              <Link
                key={note._id}
                href={`/notes/${note._id}`}
                className="card card-interactive flex flex-col"
                style={{ padding: "20px 24px", textDecoration: "none" }}
              >
                <div className="flex items-start justify-between mb-2">
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {note.visibility === "public" ? (
                      <Globe size={13} style={{ color: "var(--color-accent-pink)" }} />
                    ) : (
                      <Lock size={13} style={{ color: "var(--color-text-muted)" }} />
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteMutation.mutate(note._id);
                      }}
                      className="btn-ghost-sm"
                      style={{ padding: 4, opacity: 0.5 }}
                      title="Delete"
                    >
                      <Trash2 size={13} style={{ color: "var(--color-error)" }} />
                    </button>
                  </div>
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                    marginBottom: 4,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {note.title}
                </h3>
                {note.description && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                    }}
                  >
                    {note.description}
                  </p>
                )}
                {/* Code preview */}
                {note.codeSnippet && (
                  <pre
                    style={{
                      background: "#0d0d14",
                      fontFamily: "var(--font-mono)",
                      fontSize: 12,
                      color: "var(--color-text-secondary)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      marginBottom: 8,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {note.codeSnippet.slice(0, 120)}
                  </pre>
                )}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {note.tags?.slice(0, 4).map((t) => (
                    <span key={t} className="badge badge-accent">
                      {t}
                    </span>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-text-muted)",
                    marginTop: 8,
                  }}
                >
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center" style={{ padding: 48 }}>
          <FileText
            size={40}
            className="mx-auto"
            style={{ color: "var(--color-text-muted)", marginBottom: 12 }}
          />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
            No notes yet
          </h3>
          <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 16 }}>
            Create your first note to get started
          </p>
          <Link href="/notes/new" className="btn-primary">
            <Plus size={16} /> Create your first note
          </Link>
        </div>
      )}

      {/* Pagination */}
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
