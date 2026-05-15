"use client";
import { useState, useEffect } from "react";
import { searchAPI } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";
import { CATEGORY_MAP } from "@/lib/constants";
import Link from "next/link";
import {
  Search as SearchIcon,
  Loader2,
  Zap,
  AlertTriangle,
  Copy,
  Check,
  Bug,
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Highlight matching text ── */
function HighlightText({ text, query }) {
  if (!query || !text) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span
            key={i}
            style={{
              color: "var(--color-accent-primary)",
              fontWeight: 600,
              background: "rgba(139,92,246,0.15)",
              borderRadius: 3,
              padding: "0 2px",
            }}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("search"); // search | error
  const [errorText, setErrorText] = useState("");
  const [errorResults, setErrorResults] = useState([]);
  const [errorLoading, setErrorLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    const doSearch = async () => {
      setLoading(true);
      try {
        const { data } = await searchAPI.search({
          q: debouncedQuery,
          limit: 30,
        });
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    };
    doSearch();
  }, [debouncedQuery]);

  const handleErrorMatch = async () => {
    if (!errorText.trim() || errorText.length < 3) return;
    setErrorLoading(true);
    try {
      const { data } = await searchAPI.matchError(errorText);
      setErrorResults(data);
      if (data.length === 0)
        toast("No matching solutions found", { icon: "🔍" });
    } catch {
      toast.error("Error matching failed");
    }
    setErrorLoading(false);
  };

  const copySnippet = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="page-heading flex items-center gap-2"
          style={{ fontSize: 28 }}
        >
          <SearchIcon size={22} className="heading-icon" style={{ color: "#8b5cf6" }} /> Search
        </h1>
        <p
          className="page-subtitle"
          style={{ fontSize: 15, color: "var(--color-text-secondary)", marginTop: 4 }}
        >
          Instantly find notes, snippets, and solutions
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1"
        style={{
          background: "var(--color-bg-elevated)",
          borderRadius: 10,
          padding: 3,
          width: "fit-content",
          border: "1px solid var(--color-border)",
        }}
      >
        <button
          onClick={() => setTab("search")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: tab === "search" ? "var(--color-accent-primary)" : "transparent",
            color: tab === "search" ? "white" : "var(--color-text-secondary)",
            transition: "all 150ms ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <SearchIcon size={14} /> Search
        </button>
        <button
          onClick={() => setTab("error")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            background: tab === "error" ? "var(--color-accent-primary)" : "transparent",
            color: tab === "error" ? "white" : "var(--color-text-secondary)",
            transition: "all 150ms ease",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Bug size={14} /> Error Matcher
        </button>
      </div>

      {tab === "search" ? (
        <>
          {/* Search input */}
          <div className="relative max-w-2xl">
            <SearchIcon
              size={20}
              style={{
                position: "absolute",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                height: 52,
                fontSize: 16,
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                padding: "0 48px 0 48px",
                color: "var(--color-text-primary)",
                outline: "none",
                transition: "all 200ms ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-primary)";
                e.currentTarget.style.boxShadow = "0 0 0 2px var(--color-accent-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.boxShadow = "none";
              }}
              placeholder="Search notes, tags, code snippets..."
              autoFocus
            />
            {loading && (
              <Loader2
                size={16}
                className="animate-spin"
                style={{
                  position: "absolute",
                  right: 16,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-accent-primary)",
                }}
              />
            )}
          </div>

          {results.length > 0 && (
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              {results.length} results found
            </p>
          )}

          <div className="space-y-3">
            {results.map((r) => {
              const cat = CATEGORY_MAP[r.category] || CATEGORY_MAP.other;
              return (
                <Link
                  key={r._id}
                  href={`/notes/${r._id}`}
                  className="card card-interactive flex gap-3"
                  style={{ padding: "16px 20px", textDecoration: "none" }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{cat.icon}</span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        marginBottom: 4,
                      }}
                    >
                      <HighlightText text={r.title} query={debouncedQuery} />
                    </h3>
                    {/* Category badge */}
                    <span className="badge badge-accent" style={{ marginBottom: 6, display: "inline-flex" }}>
                      {cat.label}
                    </span>
                    {r.description && (
                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--color-text-muted)",
                          marginBottom: 6,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        <HighlightText text={r.description} query={debouncedQuery} />
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags?.slice(0, 5).map((t) => (
                        <span key={t} className="badge badge-accent">
                          {t}
                        </span>
                      ))}
                    </div>
                    {r.updatedAt && (
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-text-muted)",
                          marginTop: 6,
                          display: "block",
                        }}
                      >
                        {new Date(r.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="text-center" style={{ padding: "48px 0" }}>
              <SearchIcon
                size={40}
                className="mx-auto"
                style={{ color: "var(--color-text-muted)", marginBottom: 12 }}
              />
              <p style={{ fontSize: 15, color: "var(--color-text-secondary)" }}>
                No matches found — try different keywords
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Error Matcher */}
          <div
            className="flex items-start gap-3 max-w-2xl"
            style={{
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 10,
              padding: "12px 16px",
            }}
          >
            <Bug size={18} style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 4 }}>
                Error Matcher
              </h3>
              <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
                Paste an error message below to find past solutions from your saved notes.
              </p>
            </div>
          </div>

          <div className="max-w-2xl space-y-3">
            <textarea
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              style={{
                width: "100%",
                minHeight: 120,
                background: "var(--color-bg-base)",
                border: "1px solid var(--color-border)",
                borderRadius: 10,
                padding: "12px 16px",
                fontSize: 14,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
                outline: "none",
                resize: "vertical",
                lineHeight: 1.5,
                transition: "border-color 200ms ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "var(--color-accent-primary)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
              placeholder={`Paste an error message here...\ne.g., Cannot read properties of undefined (reading 'map')`}
            />
            <button
              onClick={handleErrorMatch}
              className="btn-primary"
              disabled={errorLoading || errorText.length < 3}
            >
              {errorLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Zap size={16} />
              )}
              Match Errors
            </button>
          </div>

          <div className="space-y-3">
            {errorResults.map((r) => (
              <div key={r._id} className="card" style={{ padding: "16px 20px" }}>
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/notes/${r._id}`}
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      textDecoration: "none",
                    }}
                  >
                    {r.title}
                  </Link>
                  <span className="badge badge-green">
                    {r.matchScore}% match
                  </span>
                </div>
                {r.description && (
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--color-text-muted)",
                      marginBottom: 8,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.description}
                  </p>
                )}
                {r.codeSnippet && (
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
                        lineHeight: 1.5,
                      }}
                    >
                      {r.codeSnippet.slice(0, 300)}
                    </pre>
                    <button
                      onClick={() => copySnippet(r.codeSnippet, r._id)}
                      className="btn-ghost-sm"
                      style={{ position: "absolute", top: 8, right: 8 }}
                    >
                      {copiedId === r._id ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
