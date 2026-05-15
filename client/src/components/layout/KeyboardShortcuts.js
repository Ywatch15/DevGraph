"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, X } from "lucide-react";

const SHORTCUTS = [
  { key: "N", label: "New note", action: "/notes/new" },
  { key: "/", label: "Search", action: "/search" },
  { key: "G", label: "Knowledge Graph", action: "/graph" },
  { key: "Esc", label: "Close modal", action: null },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleKeyDown = useCallback(
    (e) => {
      // Don't trigger if user is typing in an input or Monaco editor
      const tag = e.target?.tagName?.toLowerCase();
      const isMonacoEditor = e.target?.closest?.(".monaco-editor") || e.target?.closest?.(".editor-container");
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable || isMonacoEditor) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setOpen(true);
        return;
      }

      if (e.key === "Escape") {
        setOpen(false);
        return;
      }

      if (open) return; // Don't navigate when modal is open

      if (e.key.toLowerCase() === "n" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push("/notes/new");
      } else if (e.key === "/" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push("/search");
      } else if (e.key.toLowerCase() === "g" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        router.push("/graph");
      }
    },
    [open, router],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        title="Keyboard shortcuts (?)"
        style={{
          position: "fixed",
          top: 14,
          right: 16,
          zIndex: 45,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: "1px solid var(--color-border)",
          background: "rgba(17,17,24,0.8)",
          backdropFilter: "blur(10px)",
          color: "var(--color-text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 150ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border-hover)";
          e.currentTarget.style.color = "var(--color-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--color-border)";
          e.currentTarget.style.color = "var(--color-text-muted)";
        }}
      >
        <HelpCircle size={16} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 150ms ease",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 14,
              padding: "24px 28px",
              width: 360,
              maxWidth: "90vw",
              animation: "scaleIn 200ms ease",
            }}
          >
            <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)" }}>
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--color-text-muted)",
                  cursor: "pointer",
                  padding: 4,
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SHORTCUTS.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between"
                  style={{ padding: "8px 0" }}
                >
                  <span style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>
                    {s.label}
                  </span>
                  <kbd
                    style={{
                      background: "var(--color-bg-elevated)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 13,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-text-primary)",
                      fontWeight: 500,
                      minWidth: 32,
                      textAlign: "center",
                    }}
                  >
                    {s.key}
                  </kbd>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 16, textAlign: "center" }}>
              Press <strong>?</strong> anywhere to open this dialog
            </p>
          </div>
        </div>
      )}
    </>
  );
}
