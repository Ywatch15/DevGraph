"use client";
import { useEffect, useRef, useCallback } from "react";

const glowColorMap = {
  blue: { h: 220, s: 100, l: 60 },
  purple: { h: 270, s: 100, l: 65 },
  green: { h: 140, s: 80, l: 55 },
  red: { h: 0, s: 100, l: 60 },
  orange: { h: 30, s: 100, l: 55 },
};

const sizeMap = {
  sm: "w-48 h-64",
  md: "w-64 h-80",
  lg: "w-80 h-96",
};

export function GlowCard({
  children,
  className = "",
  glowColor = "purple",
  size = "md",
  customSize = false,
}) {
  const wrapperRef = useRef(null);
  const glowRef = useRef(null);

  const handlePointerMove = useCallback((e) => {
    const wrapper = wrapperRef.current;
    const glow = glowRef.current;
    if (!wrapper || !glow) return;
    const rect = wrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    glow.style.background = `radial-gradient(250px circle at ${x}px ${y}px, var(--glow-color), transparent 70%)`;
    glow.style.opacity = "1";
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (glowRef.current) glowRef.current.style.opacity = "0";
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener("pointermove", handlePointerMove);
    wrapper.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      wrapper.removeEventListener("pointermove", handlePointerMove);
      wrapper.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [handlePointerMove, handlePointerLeave]);

  const { h, s, l } = glowColorMap[glowColor] || glowColorMap.purple;

  return (
    <div
      ref={wrapperRef}
      className={`
        ${customSize ? "" : sizeMap[size] || sizeMap.md}
        ${!customSize ? "aspect-3/4" : ""}
        relative rounded-2xl overflow-hidden
        ${className}
      `}
      style={{
        "--glow-color": `hsla(${h}, ${s}%, ${l}%, 0.35)`,
        background: "rgba(13, 13, 22, 0.8)",
        border: "1px solid rgba(124, 92, 252, 0.15)",
      }}
    >
      {/* Spotlight glow layer — follows pointer */}
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      {/* Border glow — visible near cursor via same CSS var */}
      <div
        style={{
          position: "absolute",
          inset: -1,
          borderRadius: "inherit",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Card content — above glow layer */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

export default GlowCard;
