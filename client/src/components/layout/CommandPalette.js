"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, GitFork, FileText, Zap, X, Command } from "lucide-react";
import { searchAPI } from "@/lib/api";
import { useDebounce } from "@/hooks/useDebounce";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const debouncedQuery = useDebounce(query, 200);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Search as user types
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
          limit: 8,
        });
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
      setLoading(false);
    };
    doSearch();
  }, [debouncedQuery]);

  const ACTIONS = [
    {
      id: "new-note",
      label: "Create New Note",
      icon: Plus,
      action: () => router.push("/notes/new"),
    },
    {
      id: "search",
      label: "Go to Search",
      icon: Search,
      action: () => router.push("/search"),
    },
    {
      id: "graph",
      label: "Open Knowledge Graph",
      icon: GitFork,
      action: () => router.push("/graph"),
    },
    {
      id: "dashboard",
      label: "Go to Dashboard",
      icon: Zap,
      action: () => router.push("/dashboard"),
    },
  ];

  const allItems =
    query.length < 2
      ? ACTIONS
      : [
          ...results.map((r) => ({
            id: r._id,
            label: r.title,
            icon: FileText,
            action: () => router.push(`/notes/${r._id}`),
            subtitle: r.tags?.slice(0, 3).join(", "),
          })),
          ...ACTIONS,
        ];

  const handleSelect = useCallback((item) => {
    setOpen(false);
    item.action();
  }, []);

  const handleKeyNav = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((prev) => Math.min(prev + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selected]) handleSelect(allItems[selected]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div
        className="relative w-full max-w-xl rounded-xl shadow-2xl animate-scaleIn overflow-hidden"
        style={{
          background: "var(--color-bg-secondary)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Input */}
        <div
          className="flex items-center gap-3 px-4 h-14 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <Search size={18} style={{ color: "var(--color-text-muted)" }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={handleKeyNav}
            placeholder="Search notes, commands, or type an action..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--color-text-primary)" }}
          />
          <kbd
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: "var(--color-bg-tertiary)",
              color: "var(--color-text-muted)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-2">
          {loading && (
            <div
              className="px-4 py-3 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Searching...
            </div>
          )}
          {allItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left"
                style={{
                  background:
                    i === selected ? "var(--color-bg-hover)" : "transparent",
                  color: "var(--color-text-primary)",
                }}
                onMouseEnter={() => setSelected(i)}
              >
                <Icon
                  size={16}
                  style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate">{item.label}</p>
                  {item.subtitle && (
                    <p
                      className="text-xs truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 h-10 text-xs border-t"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="flex items-center gap-1">
            <Command size={11} /> <span>+</span> <span>K</span> to toggle
          </span>
          <span>↑↓ navigate</span>
          <span>↵ select</span>
        </div>
      </div>
    </div>
  );
}
