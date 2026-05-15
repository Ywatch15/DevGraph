"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useCallback, useRef, useEffect } from "react";
import {
  RefreshCw,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Search,
  X,
  Share2,
  ArrowRight,
  FileText,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import Link from "next/link";
import { SkeletonGraphCard } from "@/components/ui/Skeleton";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <SkeletonGraphCard />,
});

const CATEGORY_COLORS = {
  "bug-fix": "#ef4444",
  snippet: "#8b5cf6",
  architecture: "#f59e0b",
  command: "#10b981",
  config: "#3b82f6",
  learning: "#06b6d4",
  other: "#6b7280",
};

const CATEGORY_META = {
  "bug-fix": { label: "Bug Fix", emoji: "🐛", color: "#ef4444" },
  snippet: { label: "Snippet", emoji: "✂️", color: "#8b5cf6" },
  architecture: { label: "Architecture", emoji: "🏗️", color: "#f59e0b" },
  command: { label: "Command", emoji: "⌨️", color: "#10b981" },
  config: { label: "Config", emoji: "⚙️", color: "#3b82f6" },
  learning: { label: "Learning", emoji: "📚", color: "#06b6d4" },
  other: { label: "Other", emoji: "📌", color: "#6b7280" },
};

export default function GraphPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const graphRef = useRef();
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
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
          height: Math.max(window.innerHeight - 280, 400),
        });
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Build graph data with filtering
  const filteredData = (() => {
    if (!graphData) return { nodes: [], links: [] };
    let nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    // Build connection count map
    const connectionCount = {};
    edges.forEach((e) => {
      connectionCount[e.source] = (connectionCount[e.source] || 0) + 1;
      connectionCount[e.target] = (connectionCount[e.target] || 0) + 1;
    });

    // Search matching
    const matchingIds = searchQuery
      ? new Set(
          nodes
            .filter((n) =>
              n.title?.toLowerCase().includes(searchQuery.toLowerCase()),
            )
            .map((n) => n.id),
        )
      : null;

    // Category filter
    if (filterCategory) {
      nodes = nodes.filter((n) => n.category === filterCategory);
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter(
        (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
      );
    }

    return {
      nodes: nodes.map((n) => ({
        ...n,
        val: Math.min(28, 8 + (connectionCount[n.id] || 0) * 3),
        _dimmed: matchingIds ? !matchingIds.has(n.id) : false,
        _connections: connectionCount[n.id] || 0,
      })),
      links: edges.map((e) => ({
        source: e.source,
        target: e.target,
        weight: e.weight,
        relationType: e.relationType,
        sharedTags: e.sharedTags,
      })),
    };
  })();

  // Camera to best match on search
  useEffect(() => {
    if (searchQuery && graphRef.current) {
      const match = filteredData.nodes.find(
        (n) => !n._dimmed,
      );
      if (match && match.x !== undefined) {
        graphRef.current.centerAt(match.x, match.y, 500);
        graphRef.current.zoom(2, 500);
      }
    }
  }, [searchQuery, filteredData.nodes]);

  const handleNodeClick = useCallback(
    (node) => {
      setSelectedNode(node);
    },
    [],
  );

  const nodeCanvasObject = useCallback(
    (node, ctx, globalScale) => {
      const size = Math.min(28, 8 + (node._connections || 0) * 3) / 2;
      const color = CATEGORY_COLORS[node.category] || "#6b7280";
      const dimmed = node._dimmed;
      const alpha = dimmed ? 0.2 : 1;

      ctx.globalAlpha = alpha;

      // Pulse ring for isolated nodes
      if (node._connections === 0 && !dimmed) {
        const pulsePhase = (Date.now() % 2000) / 2000;
        const pulseRadius = size + 4 + Math.sin(pulsePhase * Math.PI * 2) * 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.globalAlpha = alpha * (0.3 + Math.sin(pulsePhase * Math.PI * 2) * 0.2);
        ctx.stroke();
        ctx.globalAlpha = alpha;
      }

      // Glow
      ctx.shadowColor = color;
      ctx.shadowBlur = dimmed ? 0 : 8;
      ctx.beginPath();
      ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label (hide when zoomed out)
      if (globalScale > 0.6 && !dimmed) {
        const fontSize = 11 / globalScale;
        ctx.font = `${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = `rgba(255,255,255,${0.85 * alpha})`;
        ctx.textAlign = "center";
        ctx.fillText(
          node.title?.slice(0, 25) || "",
          node.x,
          node.y + size + fontSize + 2,
        );
      }

      ctx.globalAlpha = 1;
    },
    [],
  );

  // Get connected nodes for side panel
  const getConnectedNodes = (nodeId) => {
    if (!graphData) return [];
    const edges = graphData.edges || [];
    const connectedIds = new Set();
    edges.forEach((e) => {
      if (e.source === nodeId) connectedIds.add(e.target);
      if (e.target === nodeId) connectedIds.add(e.source);
    });
    return (graphData.nodes || []).filter((n) => connectedIds.has(n.id));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1
            className="page-heading flex items-center gap-2"
            style={{ fontSize: 28 }}
          >
            <Share2 size={22} className="heading-icon" style={{ color: "#8b5cf6" }} /> Knowledge Graph
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--color-text-secondary)",
              marginTop: 4,
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#10b981",
                marginRight: 6,
              }}
            />
            {filteredData.nodes.length} nodes · {filteredData.links.length} connections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateMutation.mutate()}
            className="btn-primary"
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Generate Graph
          </button>
        </div>
      </div>

      {/* Graph container */}
      <div
        id="graph-container"
        className="relative"
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid var(--color-border)",
          background: "#08080e",
          padding: 8,
        }}
      >
        {/* Search inside graph */}
        <div
          style={{
            position: "absolute",
            top: 16,
            left: 16,
            zIndex: 10,
            width: 240,
          }}
        >
          <div className="relative">
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-text-muted)",
                pointerEvents: "none",
              }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search nodes..."
              style={{
                width: "100%",
                background: "rgba(17,17,24,0.9)",
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: "8px 12px 8px 32px",
                fontSize: 13,
                color: "var(--color-text-primary)",
                outline: "none",
                backdropFilter: "blur(10px)",
              }}
            />
          </div>
        </div>

        {/* Floating controls */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "rgba(17,17,24,0.85)",
            border: "1px solid var(--color-border)",
            borderRadius: 10,
            padding: 4,
            backdropFilter: "blur(10px)",
          }}
        >
          {[
            { icon: ZoomIn, action: () => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 300), title: "Zoom In" },
            { icon: ZoomOut, action: () => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 300), title: "Zoom Out" },
            { icon: Maximize2, action: () => graphRef.current?.zoomToFit(400, 40), title: "Fit" },
            { icon: Crosshair, action: () => graphRef.current?.centerAt(0, 0, 400), title: "Center" },
          ].map((ctrl, i) => (
            <button
              key={i}
              onClick={ctrl.action}
              title={ctrl.title}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 150ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                e.currentTarget.style.color = "var(--color-text-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              <ctrl.icon size={16} />
            </button>
          ))}
        </div>

        {isLoading ? (
          <SkeletonGraphCard />
        ) : filteredData.nodes.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{ height: 400 }}
          >
            <div className="animate-pulse-ring" style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "rgba(139,92,246,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}>
              <Share2 size={28} style={{ color: "var(--color-text-muted)" }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 8 }}>
              No connections yet
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", textAlign: "center", maxWidth: 320, marginBottom: 16 }}>
              Add more notes with shared tags to see relationships form
            </p>
            <button
              onClick={() => generateMutation.mutate()}
              className="btn-primary"
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Generate Graph
            </button>
          </div>
        ) : (
          <ForceGraph2D
            ref={graphRef}
            graphData={filteredData}
            width={dimensions.width}
            height={dimensions.height}
            nodeCanvasObject={nodeCanvasObject}
            nodePointerAreaPaint={(node, color, ctx) => {
              const size = Math.min(28, 8 + (node._connections || 0) * 3) / 2;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            onNodeClick={handleNodeClick}
            linkColor={() => "rgba(139, 92, 246, 0.4)"}
            linkWidth={(link) => Math.max(0.5, (link.weight || 0) * 2)}
            backgroundColor="transparent"
            cooldownTicks={100}
            nodeRelSize={5}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.004}
            linkDirectionalParticleColor={() => "#8b5cf6"}
          />
        )}

        {/* Node detail side panel */}
        {selectedNode && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 300,
              background: "var(--color-bg-card)",
              borderLeft: "1px solid var(--color-border)",
              padding: 20,
              zIndex: 20,
              overflowY: "auto",
              animation: "slideInRight 250ms ease",
            }}
          >
            <style>{`
              @keyframes slideInRight {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}</style>
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "transparent",
                border: "none",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8, paddingRight: 24 }}>
              {selectedNode.title}
            </h3>
            <span className="badge badge-accent" style={{ marginBottom: 12, display: "inline-flex" }}>
              {CATEGORY_META[selectedNode.category]?.emoji} {CATEGORY_META[selectedNode.category]?.label || selectedNode.category}
            </span>
            {selectedNode.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1" style={{ marginBottom: 12, marginTop: 8 }}>
                {selectedNode.tags.map((t) => (
                  <span key={t} className="badge badge-accent" style={{ fontSize: 11 }}>
                    <Tag size={10} style={{ marginRight: 3 }} /> {t}
                  </span>
                ))}
              </div>
            )}
            {selectedNode.description && (
              <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 16 }}>
                {selectedNode.description?.slice(0, 150)}{selectedNode.description?.length > 150 ? "..." : ""}
              </p>
            )}
            <Link
              href={`/notes/${selectedNode.id}`}
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", marginBottom: 16 }}
            >
              <FileText size={14} /> Open Note
            </Link>
            {/* Connected nodes */}
            {getConnectedNodes(selectedNode.id).length > 0 && (
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--color-text-muted)", marginBottom: 8 }}>
                  Connected Notes
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {getConnectedNodes(selectedNode.id).map((cn) => (
                    <button
                      key={cn.id}
                      onClick={() => {
                        setSelectedNode(cn);
                        if (graphRef.current && cn.x !== undefined) {
                          graphRef.current.centerAt(cn.x, cn.y, 500);
                        }
                      }}
                      className="list-row"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                        fontSize: 13,
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      <span style={{ color: CATEGORY_COLORS[cn.category] || "#6b7280" }}>
                        {CATEGORY_META[cn.category]?.emoji || "📌"}
                      </span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {cn.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Legend */}
      <div
        className="flex items-center flex-wrap gap-4"
        style={{
          height: 48,
          fontSize: 13,
          padding: "12px 20px",
        }}
      >
        {Object.entries(CATEGORY_META).map(([cat, meta]) => {
          const isActive = filterCategory === cat;
          const count = (graphData?.nodes || []).filter((n) => n.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? "" : cat)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                borderRadius: 20,
                border: `1px solid ${isActive ? "var(--color-accent-primary)" : "var(--color-border)"}`,
                background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
                color: isActive ? meta.color : "var(--color-text-secondary)",
                cursor: "pointer",
                fontSize: 13,
                transition: "all 150ms ease",
              }}
            >
              <span>{meta.emoji}</span>
              <span>{meta.label}</span>
              {count > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-text-muted)",
                    fontFamily: "var(--font-mono)",
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
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 12px",
              borderRadius: 20,
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
