"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notesAPI, tagsAPI } from "@/lib/api";
import { LANGUAGES, CATEGORIES, PRESET_TAGS } from "@/lib/constants";
import {
  Save,
  ArrowLeft,
  Globe,
  Lock,
  X,
  Tag,
  Zap,
  Loader2,
  Copy,
  Check,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="h-80 shimmer rounded-lg"
      style={{ background: "var(--color-bg-tertiary)" }}
    />
  ),
});

export default function NoteEditorPage({ params }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const queryClient = useQueryClient();
  const editorRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState("private");
  const [category, setCategory] = useState("other");
  const [sourceUrl, setSourceUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showPresetTags, setShowPresetTags] = useState(false);
  const [relatedNotes, setRelatedNotes] = useState([]);

  // Load existing note
  const { data: note, isLoading } = useQuery({
    queryKey: ["note", id],
    queryFn: () => notesAPI.getById(id).then((r) => r.data),
    enabled: !isNew,
  });

  // Load related notes
  const { data: related } = useQuery({
    queryKey: ["related", id],
    queryFn: () => notesAPI.getRelated(id).then((r) => r.data),
    enabled: !isNew && !!note,
  });

  useEffect(() => {
    if (note && !isNew) {
      setTitle(note.title || "");
      setDescription(note.description || "");
      setCodeSnippet(note.codeSnippet || "");
      setLanguage(note.language || "javascript");
      setTags(note.tags || []);
      setVisibility(note.visibility || "private");
      setCategory(note.category || "other");
      setSourceUrl(note.sourceUrl || "");
    }
  }, [note, isNew]);

  useEffect(() => {
    if (related) setRelatedNotes(related);
  }, [related]);

  // Tag suggestions from API
  useEffect(() => {
    if (tagInput.length < 1) {
      setTagSuggestions([]);
      return;
    }
    const fetch = async () => {
      try {
        const { data } = await tagsAPI.suggest(tagInput);
        setTagSuggestions(data.filter((t) => !tags.includes(t.name)));
      } catch {
        /* ignore */
      }
    };
    const timer = setTimeout(fetch, 200);
    return () => clearTimeout(timer);
  }, [tagInput, tags]);

  const addTag = (tag) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !tags.includes(normalized) && tags.length < 20) {
      setTags([...tags, normalized]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };

  const removeTag = (tag) => setTags(tags.filter((t) => t !== tag));

  // Monaco: use onMount to get editor ref, read value from ref instead of state (fixes cursor lag)
  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      // Read code from Monaco ref directly (avoids stale state)
      const currentCode = editorRef.current
        ? editorRef.current.getValue()
        : codeSnippet;
      const payload = {
        title,
        description,
        codeSnippet: currentCode,
        language,
        tags,
        visibility,
        category,
        sourceUrl,
      };
      if (isNew) {
        const { data } = await notesAPI.create(payload);
        toast.success("Note created!");
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        queryClient.invalidateQueries({ queryKey: ["stats"] });
        router.push(`/notes/${data._id}`);
      } else {
        await notesAPI.update(id, payload);
        toast.success("Note saved!");
        queryClient.invalidateQueries({ queryKey: ["note", id] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    }
    setSaving(false);
  };

  const copySnippet = () => {
    const code = editorRef.current ? editorRef.current.getValue() : codeSnippet;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter preset tags to only show unused ones
  const availablePresets = PRESET_TAGS.filter((t) => !tags.includes(t));

  if (!isNew && isLoading) {
    return (
      <div className="p-6 md:p-8">
        <div
          className="h-8 w-64 shimmer rounded mb-6"
          style={{ background: "var(--color-bg-tertiary)" }}
        />
        <div className="space-y-4">
          <div
            className="h-12 shimmer rounded-lg"
            style={{ background: "var(--color-bg-tertiary)" }}
          />
          <div
            className="h-32 shimmer rounded-lg"
            style={{ background: "var(--color-bg-tertiary)" }}
          />
          <div
            className="h-64 shimmer rounded-lg"
            style={{ background: "var(--color-bg-tertiary)" }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 animate-fadeIn">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost">
            <ArrowLeft size={16} />
          </button>
          <h1
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {isNew ? "New Note" : "Edit Note"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setVisibility(visibility === "private" ? "public" : "private")
            }
            className="btn-secondary text-xs"
          >
            {visibility === "public" ? (
              <>
                <Globe size={14} /> Public
              </>
            ) : (
              <>
                <Lock size={14} /> Private
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            className="btn-primary"
            disabled={saving}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isNew ? "Create" : "Save"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Editor area (3 cols) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-2xl font-bold"
            placeholder="Untitled note..."
            style={{ color: "var(--color-text-primary)" }}
          />

          {/* Category + Language + Source URL */}
          <div className="flex flex-wrap gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input w-auto text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input w-auto text-sm"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="input flex-1 text-sm min-w-50"
              placeholder="Source URL (optional)"
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="input resize-y"
              placeholder="Describe the problem, solution, or concept..."
              style={{ fontFamily: "var(--font-sans)" }}
            />
          </div>

          {/* Code snippet — Monaco in UNCONTROLLED mode to fix cursor lag */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Code Snippet
              </label>
              {codeSnippet && (
                <button onClick={copySnippet} className="btn-ghost text-xs">
                  {copied ? <Check size={13} /> : <Copy size={13} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              )}
            </div>
            <div
              className="rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--color-border)" }}
            >
              <MonacoEditor
                height="320px"
                language={
                  language === "csharp"
                    ? "csharp"
                    : language === "cpp"
                      ? "cpp"
                      : language
                }
                defaultValue={codeSnippet}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "JetBrains Mono, Fira Code, monospace",
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  padding: { top: 12 },
                  wordWrap: "on",
                  renderLineHighlight: "gutter",
                  tabSize: 2,
                  automaticLayout: true,
                }}
              />
            </div>
          </div>

          {/* Tags section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Tags{" "}
                <span style={{ color: "var(--color-text-muted)" }}>
                  ({tags.length}/20)
                </span>
              </label>
              <button
                onClick={() => setShowPresetTags(!showPresetTags)}
                className="btn-ghost text-xs"
              >
                <ChevronDown
                  size={13}
                  className={showPresetTags ? "rotate-180" : ""}
                  style={{ transition: "transform 0.2s" }}
                />
                Popular Tags
              </button>
            </div>

            {/* Preset tags dropdown */}
            {showPresetTags && (
              <div
                className="flex flex-wrap gap-1.5 mb-3 p-3 rounded-lg animate-fadeIn"
                style={{
                  background: "var(--color-bg-tertiary)",
                  border: "1px solid var(--color-border)",
                }}
              >
                {availablePresets.map((t) => (
                  <button
                    key={t}
                    onClick={() => addTag(t)}
                    className="badge badge-accent cursor-pointer transition-all hover:scale-105"
                  >
                    + {t}
                  </button>
                ))}
                {availablePresets.length === 0 && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    All popular tags are already added!
                  </p>
                )}
              </div>
            )}

            {/* Current tags */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="badge badge-accent flex items-center gap-1"
                >
                  {t}
                  <button
                    onClick={() => removeTag(t)}
                    className="ml-0.5 opacity-60 hover:opacity-100"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>

            {/* Tag input with autocomplete */}
            <div className="relative">
              <Tag
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && tagInput.trim()) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                className="input input-with-icon text-sm"
                placeholder="Type to add tags (Enter to add)..."
              />
              {tagSuggestions.length > 0 && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-10 shadow-xl"
                  style={{
                    background: "var(--color-bg-elevated)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {tagSuggestions.slice(0, 6).map((s) => (
                    <button
                      key={s.name}
                      onClick={() => addTag(s.name)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors text-left"
                      style={{ color: "var(--color-text-primary)" }}
                      onMouseEnter={(e) =>
                        (e.target.style.background = "var(--color-bg-hover)")
                      }
                      onMouseLeave={(e) =>
                        (e.target.style.background = "transparent")
                      }
                    >
                      <span>{s.name}</span>
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        used {s.usageCount}×
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Context panel (1 col) */}
        <div className="space-y-5">
          {/* Related notes */}
          <div className="card">
            <h3
              className="font-semibold text-xs flex items-center gap-1.5 mb-3"
              style={{ color: "var(--color-text-primary)" }}
            >
              <Zap size={13} style={{ color: "var(--color-accent)" }} /> Related
              Knowledge
            </h3>
            {relatedNotes.length > 0 ? (
              relatedNotes.map((rn) => (
                <a
                  key={rn._id}
                  href={`/notes/${rn._id}`}
                  className="block px-2 py-2 rounded-md text-xs mb-1 transition-colors"
                  style={{ color: "var(--color-text-secondary)" }}
                  onMouseEnter={(e) =>
                    (e.target.style.background = "var(--color-bg-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.target.style.background = "transparent")
                  }
                >
                  {rn.title}
                  {rn.similarity > 0 && (
                    <span
                      className="ml-1 text-[10px]"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {Math.round(rn.similarity * 100)}%
                    </span>
                  )}
                </a>
              ))
            ) : (
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {isNew ? "Save to see related notes" : "No related notes found"}
              </p>
            )}
          </div>

          {/* Quick tips */}
          <div className="card">
            <h3
              className="font-semibold text-xs mb-3"
              style={{ color: "var(--color-text-primary)" }}
            >
              💡 Tips
            </h3>
            <ul
              className="space-y-1.5 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <li>
                • Use{" "}
                <kbd
                  className="px-1 rounded text-[10px]"
                  style={{
                    background: "var(--color-bg-tertiary)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  Ctrl+K
                </kbd>{" "}
                for quick search
              </li>
              <li>• Click &quot;Popular Tags&quot; for presets</li>
              <li>• Public notes appear in the feed</li>
              <li>• Add code for syntax highlighting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
