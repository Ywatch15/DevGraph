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
} from "lucide-react";
import toast from "react-hot-toast";

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
    <div className="space-y-6 animate-springIn">
      <div>
        <h1
          className="text-2xl font-semibold flex items-center gap-2 page-heading"
        >
          <SearchIcon size={22} className="heading-icon" style={{ color: "#7c3aed" }} /> Search
        </h1>
        <p
          className="text-sm mt-0.5 page-subtitle"
          style={{ color: "var(--color-text-muted)" }}
        >
          Instantly find notes, snippets, and solutions
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl w-fit nm-inset"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <button
          onClick={() => setTab("search")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase transition-all ${tab === "search" ? "text-white" : ""}`}
          style={{
            background:
              tab === "search" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "transparent",
            color: tab === "search" ? "white" : "var(--color-text-secondary)",
            letterSpacing: "0.05em",
            transitionTimingFunction: "var(--nm-spring)",
          }}
        >
          <SearchIcon size={14} className="inline mr-1.5" /> Search
        </button>
        <button
          onClick={() => setTab("error")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold uppercase transition-all`}
          style={{
            background: tab === "error" ? "linear-gradient(135deg, #7c3aed, #6d28d9)" : "transparent",
            color: tab === "error" ? "white" : "var(--color-text-secondary)",
            letterSpacing: "0.05em",
            transitionTimingFunction: "var(--nm-spring)",
          }}
        >
          <AlertTriangle size={14} className="inline mr-1.5" /> Error Matcher
        </button>
      </div>

      {tab === "search" ? (
        <>
          <div className="relative max-w-2xl">
            <SearchIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input input-with-icon py-3 text-base"
              placeholder="Search notes, tags, code snippets..."
              autoFocus
            />
            {loading && (
              <Loader2
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin"
                style={{ color: "var(--color-accent)" }}
              />
            )}
          </div>

          {results.length > 0 && (
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
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
                  className="card card-interactive p-4 flex gap-3"
                >
                  <span className="text-lg flex-shrink-0">{cat.icon}</span>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="font-semibold text-sm mb-1"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {r.title}
                    </h3>
                    {r.description && (
                      <p
                        className="text-sm line-clamp-2 mb-2"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {r.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {r.tags?.slice(0, 5).map((t) => (
                        <span key={t} className="badge badge-accent">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="text-center py-12">
              <SearchIcon
                size={40}
                className="mx-auto mb-3"
                style={{ color: "var(--color-text-muted)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No results found for &quot;{query}&quot;
              </p>
            </div>
          )}
        </>
      ) : (
        <>
          <div
            className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm max-w-2xl"
            style={{
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
            <span>
              Error Matcher searches through your saved notes to find past solutions. It only works if you&apos;ve previously saved notes about related bugs, fixes, or error resolutions.
            </span>
          </div>

          <div className="max-w-2xl space-y-3">
            <textarea
              value={errorText}
              onChange={(e) => setErrorText(e.target.value)}
              rows={4}
              className="input resize-y font-mono text-sm"
              placeholder="Paste an error message here...&#10;e.g., Cannot read properties of undefined (reading 'map')"
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
              Find Solutions
            </button>
          </div>

          <div className="space-y-3">
            {errorResults.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/notes/${r._id}`}
                    className="font-semibold text-sm hover:underline"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {r.title}
                  </Link>
                  <span className="badge badge-green">
                    {r.matchScore}% match
                  </span>
                </div>
                {r.description && (
                  <p
                    className="text-sm mb-2 line-clamp-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {r.description}
                  </p>
                )}
                {r.codeSnippet && (
                  <div className="relative">
                    <pre
                      className="rounded-md px-3 py-2 text-sm overflow-x-auto"
                      style={{
                        background: "var(--color-bg-primary)",
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {r.codeSnippet.slice(0, 300)}
                    </pre>
                    <button
                      onClick={() => copySnippet(r.codeSnippet, r._id)}
                      className="absolute top-2 right-2 btn-ghost text-sm"
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
