"use client";
import Link from "next/link";
import { ArrowRight, GitFork, Search, Code2, Globe } from "lucide-react";
import Squares from "@/components/ui/Squares";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Search,
    title: "Instant Search",
    desc: "Find any note in <200ms with fuzzy matching across all your knowledge.",
  },
  {
    icon: GitFork,
    title: "Knowledge Graph",
    desc: "See connections between your ideas visually with an interactive force-directed graph.",
  },
  {
    icon: Code2,
    title: "Code Intelligence",
    desc: "Syntax highlighting, error matching, and a shared snippet library.",
  },
];

const HERO_WORDS = ["Capture.", "Connect.", "Recall", "Instantly."];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--color-bg-base)" }}
    >
      {/* Animated squares background */}
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.4}
          squareSize={44}
          direction="diagonal"
          borderColor="rgba(139, 92, 246, 0.12)"
          hoverFillColor="rgba(139, 92, 246, 0.18)"
        />
      </div>

      {/* Hero Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16">
        <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8L16 16L10 24" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 22L24 22" stroke="#00d4aa" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: 16,
              color: "var(--color-text-primary)",
            }}
          >
            DevGraph
          </span>
        </Link>
        <div className="flex items-center gap-3 ml-auto">
          {user ? (
            <Link href="/dashboard" className="btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="btn-ghost"
                style={{ padding: "8px 16px" }}
              >
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div style={{ maxWidth: 720 }}>
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 mb-6"
            style={{
              padding: "6px 16px",
              borderRadius: 20,
              background: "rgba(139,92,246,0.12)",
              color: "var(--color-accent-secondary)",
              border: "1px solid rgba(139,92,246,0.25)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 8L16 16L10 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 22L24 22" stroke="#00d4aa" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            Your Developer Second Brain
          </motion.div>

          {/* Animated heading */}
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 16,
            }}
          >
            {HERO_WORDS.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{
                  display: "inline-block",
                  marginRight: 12,
                  background: (word === "Recall" || word === "Instantly.")
                    ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                    : "none",
                  WebkitBackgroundClip: (word === "Recall" || word === "Instantly.") ? "text" : "initial",
                  WebkitTextFillColor: (word === "Recall" || word === "Instantly.") ? "transparent" : "white",
                  backgroundClip: (word === "Recall" || word === "Instantly.") ? "text" : "initial",
                }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{
              fontSize: "clamp(16px, 2vw, 20px)",
              color: "var(--color-text-secondary)",
              marginBottom: 32,
              maxWidth: 600,
              marginLeft: "auto",
              marginRight: "auto",
              lineHeight: 1.6,
            }}
          >
            Store bugs, solutions, commands, snippets, and architecture notes.
            Search in milliseconds. Explore your knowledge graph. Share with the community.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/register"
              className="btn-primary"
              style={{ height: 52, padding: "0 28px", fontSize: 16 }}
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
            <Link
              href="/feed"
              className="btn-ghost"
              style={{ height: 52, padding: "0 28px", fontSize: 16 }}
            >
              <Globe size={16} /> View Public Feed
            </Link>
          </motion.div>
        </div>

        {/* Feature grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-20 w-full"
          style={{ maxWidth: 960 }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
              className="card"
              style={{
                padding: "24px 24px",
                textAlign: "left",
                cursor: "default",
              }}
            >
              <f.icon
                size={24}
                style={{ color: "var(--color-accent-primary)", marginBottom: 12 }}
              />
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: 6,
                }}
              >
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Tech stack strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex items-center gap-6 mt-12"
          style={{ color: "var(--color-text-muted)", fontSize: 13 }}
        >
          <span>Built with</span>
          {["Next.js", "Supabase", "Monaco"].map((tech) => (
            <span
              key={tech}
              style={{
                background: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 12,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-secondary)",
              }}
            >
              {tech}
            </span>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center"
        style={{
          padding: "24px 0",
          fontSize: 14,
          color: "var(--color-text-muted)",
          borderTop: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} DevGraph</span>
          <span>·</span>
          <span>Solve it once. Remember it forever.</span>
        </div>
      </footer>
    </div>
  );
}
