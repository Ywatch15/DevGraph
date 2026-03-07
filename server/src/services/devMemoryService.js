const Note = require("../models/Note");
const TfIdf = require("../utils/tfidf");
const { extractTags } = require("../utils/tagExtractor");

class DevMemoryService {
  constructor() {
    this.tfidf = new TfIdf();
    this.initialized = false;
    this.userId = null;
  }

  async init(userId) {
    if (this.initialized && this.userId === userId.toString()) return;

    this.tfidf = new TfIdf();
    const notes = await Note.find({ userId })
      .select("title description tags codeSnippet category")
      .lean();

    for (const note of notes) {
      const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.codeSnippet || ""}`;
      this.tfidf.addDocument(note._id.toString(), text);
    }

    this.userId = userId.toString();
    this.initialized = true;
  }

  /**
   * Error-to-Solution Matcher
   * Paste an error message and find matching solutions
   */
  async matchError(userId, errorText) {
    await this.init(userId);

    const results = this.tfidf.findSimilarToText(errorText, 10);
    if (results.length === 0) return [];

    const ids = results.map((r) => r.id);
    const notes = await Note.find({ _id: { $in: ids } })
      .select("title description codeSnippet tags category updatedAt")
      .lean();

    return notes
      .map((note) => {
        const match = results.find((r) => r.id === note._id.toString());
        return {
          ...note,
          matchScore: match ? Math.round(match.similarity * 100) : 0,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Smart suggestions while typing
   */
  async suggest(userId, text) {
    await this.init(userId);

    if (!text || text.length < 3) return [];

    const results = this.tfidf.findSimilarToText(text, 5);
    if (results.length === 0) return [];

    const ids = results.map((r) => r.id);
    const notes = await Note.find({ _id: { $in: ids } })
      .select("title tags category")
      .lean();

    return notes
      .map((note) => {
        const match = results.find((r) => r.id === note._id.toString());
        return {
          _id: note._id,
          title: note.title,
          tags: note.tags,
          category: note.category,
          relevance: match ? Math.round(match.similarity * 100) : 0,
        };
      })
      .sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Get developer activity patterns
   */
  async getPatterns(userId) {
    const notes = await Note.find({ userId })
      .select("tags category createdAt language")
      .lean();

    // Most used technologies
    const techCount = {};
    const categoryCount = {};
    const langCount = {};

    for (const note of notes) {
      for (const tag of note.tags || []) {
        techCount[tag] = (techCount[tag] || 0) + 1;
      }
      categoryCount[note.category] = (categoryCount[note.category] || 0) + 1;
      langCount[note.language] = (langCount[note.language] || 0) + 1;
    }

    const topTech = Object.entries(techCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    const topLanguages = Object.entries(langCount)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    return { topTech, topCategories, topLanguages, totalNotes: notes.length };
  }
}

module.exports = new DevMemoryService();
