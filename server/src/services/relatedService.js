const { supabase } = require("../config/supabase");
const { TFIDFEngine } = require("../utils/tfidf");

class RelatedService {
  async getRelated(noteId, userId, limit = 5) {
    // Get target note
    const { data: note } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (!note) return [];

    // Get other user notes
    const { data: otherNotes } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .neq("id", noteId)
      .limit(100);

    if (!otherNotes || otherNotes.length === 0) return [];

    // Build TF-IDF for similarity
    const engine = new TFIDFEngine();
    const noteText = `${note.title} ${note.description || ""} ${(note.tags || []).join(" ")}`;
    engine.addDocument(note.id, noteText);

    for (const other of otherNotes) {
      const text = `${other.title} ${other.description || ""} ${(other.tags || []).join(" ")}`;
      engine.addDocument(other.id, text);
    }

    engine.computeIDF();

    const similarities = otherNotes.map((other) => ({
      _id: other.id,
      id: other.id,
      title: other.title,
      tags: other.tags || [],
      category: other.category,
      similarity: engine.cosineSimilarity(note.id, other.id),
    }));

    return similarities
      .filter((s) => s.similarity > 0.05)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

module.exports = new RelatedService();
