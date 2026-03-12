"use client";
import { useState, useId } from "react";

export default function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const hasValue = value && value.length > 0;
  const floated = focused || hasValue;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="input peer pt-5 pb-2"
        placeholder=" "
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute left-3.5 transition-all pointer-events-none"
        style={{
          top: floated ? "0.45rem" : "0.85rem",
          fontSize: floated ? "0.6rem" : "0.8rem",
          fontWeight: floated ? 700 : 400,
          textTransform: floated ? "uppercase" : "none",
          letterSpacing: floated ? "0.15em" : "0",
          color: focused
            ? "var(--color-accent)"
            : "var(--color-text-muted)",
          transitionDuration: "0.3s",
          transitionTimingFunction: "var(--nm-spring)",
        }}
      >
        {label}
      </label>
    </div>
  );
}
