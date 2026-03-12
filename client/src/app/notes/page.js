"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notesAPI } from "@/lib/api";
import { CATEGORY_MAP } from "@/lib/constants";
import Link from "next/link";
import { useState } from "react";
import { Plus, Search, Filter, Trash2, Globe, Lock, X, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function NotesListPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
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
    <div className="space-y-6 animate-springIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
          >
            <FileText size={22} style={{ color: "#7c3aed" }} /> My Notes
          </h1>
          <p
            className="text-sm mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            {pagination.total} total notes
          </p>
        </div>
        <Link href="/notes/new" className="btn-primary">
          <Plus size={16} /> New Note
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-with-icon"
            placeholder="Filter notes..."
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="input w-auto"
        >
          <option value="">All Categories</option>
          {Object.values(CATEGORY_MAP).map((c) => (
            <option key={c.value} value={c.value}>
              {c.icon} {c.label}
            </option>
          ))}
        </select>
      </div>

      {filterTag && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Filtered by tag:
          </span>
          <span className="badge badge-accent">
            {filterTag}
            <button onClick={() => setFilterTag("")} className="ml-1">
              <X size={10} />
            </button>
          </span>
        </div>
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-44 shimmer" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => {
            const cat = CATEGORY_MAP[note.category] || CATEGORY_MAP.other;
            return (
              <Link
                key={note._id}
                href={`/notes/${note._id}`}
                className="card card-interactive p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex items-center gap-1.5">
                    {note.visibility === "public" ? (
                      <Globe
                        size={13}
                        style={{ color: "var(--color-accent2)" }}
                      />
                    ) : (
                      <Lock
                        size={13}
                        style={{ color: "var(--color-text-muted)" }}
                      />
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        deleteMutation.mutate(note._id);
                      }}
                      className="btn-ghost p-1 opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2
                        size={13}
                        style={{ color: "var(--color-danger)" }}
                      />
                    </button>
                  </div>
                </div>
                <h3
                  className="font-semibold text-sm mb-1 line-clamp-2"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {note.title}
                </h3>
                {note.description && (
                  <p
                    className="text-xs mb-3 line-clamp-2 flex-1"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {note.description}
                  </p>
                )}
                {note.codeSnippet && (
                  <div
                    className="rounded-md px-3 py-2 mb-3 text-xs line-clamp-3 overflow-hidden"
                    style={{
                      background: "var(--color-bg-primary)",
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    {note.codeSnippet.slice(0, 120)}
                  </div>
                )}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {note.tags?.slice(0, 4).map((t) => (
                    <span key={t} className="badge badge-accent">
                      {t}
                    </span>
                  ))}
                </div>
                <p
                  className="text-[10px] mt-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <Plus
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-sm mb-3"
            style={{ color: "var(--color-text-muted)" }}
          >
            No notes found
          </p>
          <Link href="/notes/new" className="btn-primary">
            Create your first note
          </Link>
        </div>
      )}

      {/* Pagination */}
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
