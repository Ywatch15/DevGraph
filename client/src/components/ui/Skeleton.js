"use client";
import { motion } from "framer-motion";

/**
 * Skeleton pulse components for loading states.
 * Match the exact shape/dimensions of the content they replace.
 */

export function SkeletonBox({ width, height, className = "", borderRadius = 8, style = {} }) {
  return (
    <motion.div
      className={`skeleton ${className}`}
      style={{
        width: width || "100%",
        height: height || 20,
        borderRadius,
        ...style,
      }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

export function SkeletonText({ lines = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: i === lines - 1 ? "60%" : "100%" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ height = 120, className = "" }) {
  return (
    <motion.div
      className={`skeleton-card skeleton ${className}`}
      style={{ height, minHeight: height }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="skeleton-card" style={{ height: 120 }}>
      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="skeleton"
          style={{ width: 40, height: 40, borderRadius: 12 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="skeleton"
          style={{ width: 60, height: 16, borderRadius: 6 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
        />
      </div>
      <motion.div
        className="skeleton"
        style={{ width: 80, height: 32, borderRadius: 8, marginBottom: 8 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="skeleton skeleton-text"
        style={{ width: "50%" }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  );
}

export function SkeletonNoteRow() {
  return (
    <div className="flex items-center gap-3 px-6 py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <motion.div
        className="skeleton"
        style={{ width: 16, height: 16, borderRadius: 4 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <div className="flex-1 space-y-2">
        <motion.div
          className="skeleton skeleton-text"
          style={{ width: "60%" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
        />
        <div className="flex gap-2">
          <motion.div
            className="skeleton"
            style={{ width: 50, height: 16, borderRadius: 6 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="skeleton"
            style={{ width: 40, height: 16, borderRadius: 6 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
          />
        </div>
      </div>
      <motion.div
        className="skeleton"
        style={{ width: 70, height: 14, borderRadius: 6 }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

export function SkeletonGraphCard() {
  return (
    <motion.div
      className="skeleton"
      style={{
        height: 500,
        borderRadius: 14,
        border: "1px solid var(--color-border)",
      }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  );
}
