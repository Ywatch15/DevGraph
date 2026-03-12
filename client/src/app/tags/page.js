"use client";
import { useQuery } from "@tanstack/react-query";
import { tagsAPI, notesAPI } from "@/lib/api";
import Link from "next/link";
import { Tags as TagsIcon, TrendingUp } from "lucide-react";

export default function TagsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["allTags"],
    queryFn: () => tagsAPI.getAll({ limit: 100 }).then((r) => r.data),
  });

  const tags = data?.tags || [];
  const maxCount = Math.max(...tags.map((t) => t.usageCount), 1);

  return (
    <div className="space-y-6 animate-springIn">
      <div>
        <h1
          className="text-2xl font-semibold flex items-center gap-2"
          style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}
        >
          <TagsIcon size={22} style={{ color: "#7c3aed" }} /> Tags
        </h1>
        <p
          className="text-sm mt-0.5"
          style={{ color: "var(--color-text-muted)" }}
        >
          {tags.length} tags across your knowledge base
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-wrap gap-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-10 w-24 shimmer rounded-lg"
              style={{ background: "var(--color-bg-tertiary)" }}
            />
          ))}
        </div>
      ) : tags.length > 0 ? (
        <>
          {/* Tag cloud */}
          <div className="card p-6" style={{ borderRadius: "1.5rem" }}>
            <h3
              className="label-section mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <TrendingUp size={14} /> Tag Cloud
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const ratio = tag.usageCount / maxCount;
                const size = 0.7 + ratio * 0.6; // 0.7rem to 1.3rem
                const opacity = 0.5 + ratio * 0.5;
                return (
                  <Link
                    key={tag.name}
                    href={`/notes?tags=${tag.name}`}
                    className="badge badge-accent transition-transform hover:scale-110"
                    style={{
                      fontSize: `${size}rem`,
                      opacity,
                      padding: "0.25rem 0.75rem",
                    }}
                  >
                    {tag.name}
                    <span className="ml-1 opacity-60 text-[0.6em]">
                      {tag.usageCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Tag list */}
          <div className="card p-0 overflow-hidden" style={{ borderRadius: "1.5rem" }}>
            <div
              className="px-5 py-3 border-b font-semibold text-sm"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <div className="flex items-center">
                <span className="flex-1">Tag</span>
                <span className="w-20 text-right">Usage</span>
                <span className="w-32 text-right">Bar</span>
              </div>
            </div>
            {tags.map((tag) => (
              <Link
                key={tag.name}
                href={`/notes?tags=${tag.name}`}
                className="flex items-center px-5 py-2.5 hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <span
                  className="flex-1 text-sm font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {tag.name}
                </span>
                <span
                  className="w-20 text-right text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {tag.usageCount}
                </span>
                <div className="w-32 ml-4">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(tag.usageCount / maxCount) * 100}%`,
                        background: "linear-gradient(90deg, #7c3aed, #db2777)",
                        transitionTimingFunction: "var(--nm-spring)",
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <TagsIcon
            size={40}
            className="mx-auto mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            No tags yet. Tags are created when you add them to notes.
          </p>
        </div>
      )}
    </div>
  );
}
