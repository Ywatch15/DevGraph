const FlexSearch = require("flexsearch");
const Note = require("../models/Note");

class SearchService {
  constructor() {
    this.index = null;
    this.noteMap = new Map();
    this.initialized = false;
  }

  /**
   * Initialize FlexSearch index for a user
   */
  async initIndex(userId) {
    this.index = new FlexSearch.Index({
      tokenize: "forward",
      cache: true,
    });

    // Load all user notes into index
    const notes = await Note.find({ userId })
      .select("title description tags codeSnippet")
      .lean();

    for (const note of notes) {
      const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.codeSnippet || ""}`;
      this.index.add(note._id.toString(), text);
      this.noteMap.set(note._id.toString(), note);
    }

    this.initialized = true;
  }

  /**
   * Add or update a note in the index
   */
  addToIndex(note) {
    if (!this.index) return;
    const id = note._id.toString();
    const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.codeSnippet || ""}`;

    // Remove old entry if exists
    try {
      this.index.remove(id);
    } catch (e) {
      /* ignore */
    }
    this.index.add(id, text);
    this.noteMap.set(id, note);
  }

  /**
   * Remove a note from the index
   */
  removeFromIndex(noteId) {
    if (!this.index) return;
    try {
      this.index.remove(noteId.toString());
      this.noteMap.delete(noteId.toString());
    } catch (e) {
      /* ignore */
    }
  }

  /**
   * Hybrid search: FlexSearch + MongoDB text search
   */
  async search(userId, { q, tags, page = 1, limit = 20 } = {}) {
    if (!q && !tags) {
      return { results: [], pagination: { page, limit, total: 0, pages: 0 } };
    }

    // Initialize if needed
    if (!this.initialized) {
      await this.initIndex(userId);
    }

    let flexResults = [];
    let mongoResults = [];

    // FlexSearch for speed (in-memory)
    if (q && this.index) {
      const ids = this.index.search(q, { limit: 100 });
      flexResults = ids;
    }

    // MongoDB text search for completeness
    const mongoQuery = { userId };
    if (q) {
      mongoQuery.$text = { $search: q };
    }
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      mongoQuery.tags = { $in: tagList };
    }

    const mongoProjection = q ? { score: { $meta: "textScore" } } : {};
    const mongoSort = q ? { score: { $meta: "textScore" } } : { updatedAt: -1 };

    mongoResults = await Note.find(mongoQuery, mongoProjection)
      .sort(mongoSort)
      .lean();

    // Merge results: prioritize FlexSearch order, add any MongoDB-only results
    const resultMap = new Map();
    const flexSet = new Set(flexResults.map(String));

    // FlexSearch results first (they're faster / more relevant for fuzzy)
    for (const id of flexResults) {
      const note = mongoResults.find((n) => n._id.toString() === id.toString());
      if (note) {
        resultMap.set(id.toString(), {
          ...note,
          _searchScore: (note.score || 0) + 1,
        });
      }
    }

    // Add MongoDB-only results
    for (const note of mongoResults) {
      const id = note._id.toString();
      if (!resultMap.has(id)) {
        resultMap.set(id, { ...note, _searchScore: note.score || 0 });
      }
    }

    // Sort by combined score
    let results = Array.from(resultMap.values());
    results.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));

    // Paginate
    const total = results.length;
    const skip = (page - 1) * limit;
    results = results.slice(skip, skip + limit);

    return {
      results,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
}

module.exports = new SearchService();
