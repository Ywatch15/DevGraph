/**
 * Simple TF-IDF implementation for note similarity.
 * No external dependencies needed.
 */

class TfIdf {
  constructor() {
    this.documents = new Map(); // docId -> { terms: Map<string, count>, totalTerms: number }
    this.idfCache = new Map();
    this.dirty = true;
  }

  /**
   * Tokenize text into terms
   */
  tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2);
  }

  /**
   * Add a document
   */
  addDocument(id, text) {
    const tokens = this.tokenize(text);
    const terms = new Map();

    for (const token of tokens) {
      terms.set(token, (terms.get(token) || 0) + 1);
    }

    this.documents.set(id, { terms, totalTerms: tokens.length });
    this.dirty = true;
  }

  /**
   * Remove a document
   */
  removeDocument(id) {
    this.documents.delete(id);
    this.dirty = true;
  }

  /**
   * Compute IDF for all terms
   */
  computeIdf() {
    if (!this.dirty) return;

    const N = this.documents.size;
    this.idfCache.clear();

    const dfMap = new Map();
    for (const [, doc] of this.documents) {
      for (const term of doc.terms.keys()) {
        dfMap.set(term, (dfMap.get(term) || 0) + 1);
      }
    }

    for (const [term, df] of dfMap) {
      this.idfCache.set(term, Math.log((N + 1) / (df + 1)) + 1);
    }

    this.dirty = false;
  }

  /**
   * Get TF-IDF vector for a document
   */
  getVector(docId) {
    this.computeIdf();
    const doc = this.documents.get(docId);
    if (!doc) return new Map();

    const vector = new Map();
    for (const [term, count] of doc.terms) {
      const tf = count / doc.totalTerms;
      const idf = this.idfCache.get(term) || 0;
      vector.set(term, tf * idf);
    }
    return vector;
  }

  /**
   * Compute cosine similarity between two documents
   */
  similarity(docId1, docId2) {
    const v1 = this.getVector(docId1);
    const v2 = this.getVector(docId2);

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (const [term, val] of v1) {
      norm1 += val * val;
      if (v2.has(term)) {
        dotProduct += val * v2.get(term);
      }
    }

    for (const [, val] of v2) {
      norm2 += val * val;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Find most similar documents to a given document
   */
  findSimilar(docId, topN = 5) {
    this.computeIdf();
    const results = [];

    for (const [id] of this.documents) {
      if (id === docId) continue;
      const sim = this.similarity(docId, id);
      if (sim > 0.05) {
        results.push({ id, similarity: sim });
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, topN);
  }

  /**
   * Find similar documents to freeform text
   */
  findSimilarToText(text, topN = 5) {
    const tempId = "__query__";
    this.addDocument(tempId, text);
    const results = this.findSimilar(tempId, topN);
    this.removeDocument(tempId);
    return results;
  }
}

module.exports = TfIdf;
