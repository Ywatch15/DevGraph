"use client";
import { Check, Loader2 } from "lucide-react";

// state: "default" | "loading" | "success"
export default function SaveButton({ state = "default", onClick, children }) {
  const isLoading = state === "loading";
  const isSuccess = state === "success";

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white overflow-hidden transition-all"
      style={{
        background: isSuccess
          ? "linear-gradient(135deg, #10b981, #059669)"
          : "linear-gradient(135deg, #7c3aed, #db2777)",
        boxShadow: isSuccess
          ? "0 0 20px rgba(16,185,129,0.3)"
          : "0 0 20px rgba(124,58,237,0.25)",
        transitionDuration: "0.35s",
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: isLoading ? 0.8 : 1,
        cursor: isLoading ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)",
      }}
    >
      {isLoading && <Loader2 size={16} className="animate-spin" />}
      {isSuccess && <Check size={16} />}
      {isLoading ? "Saving..." : isSuccess ? "Saved" : children || "Save Changes"}
    </button>
  );
}
