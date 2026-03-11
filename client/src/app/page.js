"use client";
import Link from "next/link";
import { Zap, ArrowRight, GitFork, Search, Code2, Globe } from "lucide-react";
import Squares from "@/components/ui/Squares";
import { GlowCard } from "@/components/ui/spotlight-card";

export default function LandingPage() {
  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Animated squares background */}
      <div className="absolute inset-0 z-0">
        <Squares
          speed={0.4}
          squareSize={44}
          direction="diagonal"
          borderColor="rgba(124, 92, 252, 0.18)"
          hoverFillColor="rgba(124, 92, 252, 0.25)"
        />
      </div>

      {/* Hero Nav */}
      <header className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent), #6b4ce6)",
            }}
          >
            <Zap size={18} color="white" />
          </div>
          <span
            className="font-bold text-lg"
            style={{ color: "var(--color-text-primary)" }}
          >
            DevGraph
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary">
            Get Started <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="animate-fadeIn max-w-3xl">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-6 text-xs font-medium"
            style={{
              background: "rgba(124,92,252,0.12)",
              color: "var(--color-accent-hover)",
              border: "1px solid rgba(124,92,252,0.25)",
            }}
          >
            <Zap size={12} /> Your Developer Second Brain
          </div>
          <h1
            className="text-4xl md:text-6xl font-extrabold leading-tight mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            Capture. Connect.{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), var(--color-accent2))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Recall Instantly.
            </span>
          </h1>
          <p
            className="text-lg md:text-xl mb-8 max-w-2xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Store bugs, solutions, commands, snippets, and architecture notes.
            Search in milliseconds. Explore your knowledge graph. Share with the
            community.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register" className="btn-primary text-base px-6 py-3">
              Start Building Your Graph <ArrowRight size={16} />
            </Link>
            <Link href="/feed" className="btn-secondary text-base px-6 py-3">
              <Globe size={16} /> Explore Public Knowledge
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl w-full animate-fadeIn"
          style={{ animationDelay: "0.2s" }}
        >
          {[
            {
              icon: Search,
              title: "Instant Search",
              desc: "Find any note in <200ms with fuzzy matching",
            },
            {
              icon: GitFork,
              title: "Knowledge Graph",
              desc: "See connections between your ideas visually",
            },
            {
              icon: Code2,
              title: "Code Intelligence",
              desc: "Syntax highlighting, error matching, snippets",
            },
            {
              icon: Globe,
              title: "Community Feed",
              desc: "Share solutions and learn from other devs",
            },
          ].map((f, i) => (
            <GlowCard
              key={i}
              glowColor="purple"
              customSize
              className="w-full h-auto aspect-auto p-5 text-left cursor-pointer z-10"
            >
              <div className="relative z-10 flex flex-col gap-1">
                <f.icon
                  size={24}
                  className="mb-3"
                  style={{ color: "var(--color-accent)" }}
                />
                <h3
                  className="font-semibold text-sm mb-1"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {f.title}
                </h3>
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {f.desc}
                </p>
              </div>
            </GlowCard>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 py-6 text-center text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        Built with ♥ for developers · 100% Free · No paid APIs
      </footer>
    </div>
  );
}
