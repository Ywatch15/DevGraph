"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  Filter,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div
      className="h-150 shimmer rounded-lg"
      style={{ background: "var(--color-bg-tertiary)" }}
    />
  ),
});

const CATEGORY_COLORS = {
  "bug-fix": "#ef4444",
  snippet: "#7c3aed",
  architecture: "#3b82f6",
  command: "#10b981",
  config: "#f59e0b",
  learning: "#10b981",
  other: "#94a3b8",
};

const CATEGORY_META = {
  "bug-fix": { label: "Bug Fix", emoji: "🐛", color: "#ef4444" },
  snippet: { label: "Snippet", emoji: "✂️", color: "#7c3aed" },
  architecture: { label: "Architecture", emoji: "🏗️", color: "#3b82f6" },
  command: { label: "Command", emoji: "⌨️", color: "#10b981" },
  config: { label: "Config", emoji: "⚙️", color: "#f59e0b" },
  learning: { label: "Learning", emoji: "📚", color: "#10b981" },
  other: { label: "Other", emoji: "📌", color: "#94a3b8" },
};

export default function GraphPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const graphRef = useRef();
  const [filterTag, setFilterTag] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const {
    data: graphData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["graph"],
    queryFn: () => graphAPI.getGraph().then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => graphAPI.generate(),
    onSuccess: (res) => {
      toast.success(
        `Graph updated: ${res.data.nodes} nodes, ${res.data.edges} edges`,
      );
      queryClient.invalidateQueries({ queryKey: ["graph"] });
    },
  });

  useEffect(() => {
    const updateDimensions = () => {
      const el = document.getElementById("graph-container");
      if (el)
        setDimensions({
          width: el.clientWidth,
          height: Math.max(window.innerHeight - 200, 400),
        });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Filter nodes by tag
  const filteredData = (() => {
    if (!graphData) return { nodes: [], links: [] };
    let nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    if (filterTag) {
      nodes = nodes.filter((n) => n.tags?.includes(filterTag));
    }
    if (filterCategory) {
      nodes = nodes.filter((n) => n.category === filterCategory);
    }
    if (filterTag || filterCategory) {
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter(
        (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
      );
    }

    return {
      nodes: nodes.map((n) => ({
        ...n,
        val: Math.max(2, (n.connections || 0) + 1),
      })),
      links: edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
      })),
    };
  })();

  // All tags in current graph
  const allTags = [
    ...new Set((graphData?.nodes || []).flatMap((n) => n.tags || [])),
  ].sort();

  const handleNodeClick = useCallback(
    (node) => {
      router.push(`/notes/${node.id}`);
    },
    [router],
  );

  const nodeCanvasObject = useCallback((node, ctx) => {
    const size = Math.max(4, (node.connections || 0) * 1.5 + 4);
    const color = CATEGORY_COLORS[node.category] || "#a0a0b8";

    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Label
    ctx.font = "3px 'Satoshi', sans-serif";
    ctx.fillStyle = "#e8e8f0";
    ctx.textAlign = "center";
    ctx.fillText(node.title?.slice(0, 25) || "", node.x, node.y + size + 5);
  }, []);

  return (
    <div className="space-y-4 animate-springIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="text-2xl font-semibold flex items-center gap-2 page-heading"
          >
            <Share2 size={22} className="heading-icon" style={{ color: "#7c3aed" }} /> Knowledge Graph
          </h1>
          <p
            className="text-sm mt-0.5 page-subtitle"
            style={{ color: "var(--color-text-muted)" }}
          >
            {filteredData.nodes.length} nodes · {filteredData.links.length}{" "}
            connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            onClick={() => generateMutation.mutate()}
            className="btn-primary text-sm"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Regenerate
          </button>
        </div>
      </div>

      {/* Graph */}
      <div
        id="graph-container"
        className="rounded-2xl overflow-hidden border nm-flat"
        style={{
          background: "var(--color-bg-primary)",
          borderColor: "var(--color-border)",
        }}
      >
        {isLoading ? (
          <div className="h-150 flex items-center justify-center">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: "var(--color-accent)" }}
            />
          </div>
        ) : filteredData.nodes.length === 0 ? (
          <div className="h-100 flex flex-col items-center justify-center">
            <Maximize2
              size={40}
              className="mb-3"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No graph data yet. Create some notes and click Regenerate.
            </p>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              const size = Math.max(4, (node.connections || 0) * 1.5 + 4);
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 3, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            onNodeClick={handleNodeClick}
            linkColor={() => "rgba(124, 58, 237, 0.15)"}
            linkWidth={(link) => Math.max(0.5, (link.weight || 0) * 2)}
            backgroundColor="transparent"
            cooldownTicks={100}
            nodeRelSize={5}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />
        )}
      </div>

      {/* Category Legend — Interactive Chips */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const isActive = filterCategory === cat;
          const count = (graphData?.nodes || []).filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? "" : cat)}
              className="group flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: isActive
                  ? `${meta.color}20`
                  : "var(--color-bg-tertiary)",
                border: `1px solid ${isActive ? `${meta.color}60` : "var(--color-border)"}`,
                color: isActive ? meta.color : "var(--color-text-secondary)",
                boxShadow: isActive ? `0 0 16px ${meta.color}25` : "none",
                transform: isActive ? "scale(1.04)" : "scale(1)",
              }}
            >
              <span className="text-base leading-none">{meta.emoji}</span>
              <span>{meta.label}</span>
              {count > 0 && (
                <span
                  className="ml-0.5 px-1.5 py-0.5 rounded-md text-xs font-semibold leading-none transition-colors"
                  style={{
                    background: isActive ? `${meta.color}30` : "var(--color-bg-hover)",
                    color: isActive ? meta.color : "var(--color-text-muted)",
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
        {filterCategory && (
          <button
            onClick={() => setFilterCategory("")}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>
    </div>
  );
}
