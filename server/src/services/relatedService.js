const Note = require("../models/Note");
const TfIdf = require("../utils/tfidf");

class RelatedService {
  constructor() {
    this.tfidf = new TfIdf();
    this.initialized = false;
    this.userId = null;
  }

  /**
   * Build TF-IDF index for a user's notes
   */
  async buildIndex(userId) {
    this.tfidf = new TfIdf();
    const notes = await Note.find({ userId })
      .select("title description tags codeSnippet")
      .lean();

    for (const note of notes) {
      const text = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")} ${note.codeSnippet || ""}`;
      this.tfidf.addDocument(note._id.toString(), text);
    }

    this.userId = userId.toString();
    this.initialized = true;
  }

  /**
   * Find related notes for a given note
   */
  async findRelated(noteId, userId, topN = 5) {
    if (!this.initialized || this.userId !== userId.toString()) {
      await this.buildIndex(userId);
    }

    const similarDocs = this.tfidf.findSimilar(noteId.toString(), topN);

    if (similarDocs.length === 0) return [];

    const ids = similarDocs.map((d) => d.id);
    const notes = await Note.find({ _id: { $in: ids } })
      .select("title tags category updatedAt")
      .lean();

    // Attach similarity scores
    return notes
      .map((note) => {
        const doc = similarDocs.find((d) => d.id === note._id.toString());
        return { ...note, similarity: doc ? doc.similarity : 0 };
      })
      .sort((a, b) => b.similarity - a.similarity);
  }
}

module.exports = new RelatedService();
