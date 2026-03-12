"use client";

export default function SpringToggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full transition-colors"
        style={{
          background: checked
            ? "linear-gradient(135deg, #7c3aed, #db2777)"
            : "rgba(255,255,255,0.06)",
          boxShadow: checked
            ? "0 0 16px rgba(124,58,237,0.3)"
            : "inset 2px 2px 4px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.02)",
          transitionDuration: "0.35s",
          transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all"
          style={{
            left: checked ? "calc(100% - 1.375rem)" : "0.125rem",
            transitionDuration: "0.35s",
            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: checked ? "scale(1.05)" : "scale(1)",
          }}
        />
      </button>
      {label && (
        <span
          className="text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {label}
        </span>
      )}
    </label>
  );
}
