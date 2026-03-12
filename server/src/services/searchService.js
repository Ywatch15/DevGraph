const FlexSearch = require("flexsearch");
const { supabase } = require("../config/supabase");

class SearchService {
  constructor() {
    this.index = null;
    this.noteMap = new Map();
    this.initialized = false;
    this.currentUserId = null;
  }

  async initIndex(userId) {
    this.index = new FlexSearch.Index({
      tokenize: "forward",
      cache: true,
    });
    this.noteMap.clear();

    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, description, tags, code_snippet")
      .eq("user_id", userId);

    for (const note of notes || []) {
      const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.code_snippet || ""}`;
      this.index.add(note.id, text);
      this.noteMap.set(note.id, note);
    }

    this.initialized = true;
    this.currentUserId = userId;
  }

  addToIndex(note) {
    if (!this.index) return;
    const id = note.id || note._id;
    const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.codeSnippet || note.code_snippet || ""}`;
    try {
      this.index.remove(id);
    } catch (e) {
      /* ignore */
    }
    this.index.add(id, text);
    this.noteMap.set(id, note);
  }

  removeFromIndex(noteId) {
    if (!this.index) return;
    try {
      this.index.remove(noteId);
      this.noteMap.delete(noteId);
    } catch (e) {
      /* ignore */
    }
  }

  async search(userId, { q, tags, page = 1, limit = 20 } = {}) {
    if (!q && !tags) {
      return { results: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    if (!this.initialized || this.currentUserId !== userId) {
      await this.initIndex(userId);
    }

    let flexResults = [];

    // FlexSearch for fast prefix in-memory search
    if (q && this.index) {
      flexResults = this.index.search(q, { limit: 100 });
    }

    // PostgreSQL: prefix-aware full-text search + ilike fallback
    let pgResults = [];

    if (q) {
      // Build prefix tsquery: "de bug" -> "de:* & bug:*"
      const terms = q.trim().split(/\s+/).filter(Boolean);
      const prefixQuery = terms.map((t) => t.replace(/[^a-zA-Z0-9]/g, "") + ":*").join(" & ");

      // Full-text search with prefix matching
      let ftsQuery = supabase.from("notes").select("*").eq("user_id", userId);
      if (prefixQuery) {
        ftsQuery = ftsQuery.textSearch("fts", prefixQuery);
      }
      if (tags) {
        const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
        ftsQuery = ftsQuery.overlaps("tags", tagList);
      }
      const { data: ftsResults } = await ftsQuery;
      if (ftsResults) pgResults.push(...ftsResults);

      // ilike fallback for partial matches FTS might miss
      const seen = new Set(pgResults.map((n) => n.id));
      const pattern = `%${q}%`;
      let ilikeQuery = supabase.from("notes").select("*").eq("user_id", userId)
        .or(`title.ilike.${pattern},description.ilike.${pattern},code_snippet.ilike.${pattern}`);
      if (tags) {
        const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
        ilikeQuery = ilikeQuery.overlaps("tags", tagList);
      }
      const { data: ilikeResults } = await ilikeQuery;
      for (const note of ilikeResults || []) {
        if (!seen.has(note.id)) {
          pgResults.push(note);
          seen.add(note.id);
        }
      }
    } else if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      const { data } = await supabase.from("notes").select("*").eq("user_id", userId).overlaps("tags", tagList);
      pgResults = data || [];
    }

    // Merge: FlexSearch first, then PG-only
    const resultMap = new Map();
    const flexSet = new Set(flexResults.map(String));

    for (const id of flexResults) {
      const note = (pgResults || []).find((n) => n.id === id);
      if (note)
        resultMap.set(id, { ...this.formatNote(note), _searchScore: 2 });
    }

    for (const note of pgResults || []) {
      if (!resultMap.has(note.id)) {
        resultMap.set(note.id, { ...this.formatNote(note), _searchScore: 1 });
      }
    }

    let results = Array.from(resultMap.values());
    results.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));

    const total = results.length;
    const skip = (page - 1) * limit;
    results = results.slice(skip, skip + limit);

    return {
      results,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  formatNote(row) {
    if (!row) return null;
    return {
      _id: row.id,
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      codeSnippet: row.code_snippet,
      language: row.language,
      tags: row.tags || [],
      sourceUrl: row.source_url,
      visibility: row.visibility,
      category: row.category,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

module.exports = new SearchService();
