const { supabase } = require("../config/supabase");
const { TFIDFEngine } = require("../utils/tfidf");

class DevMemoryService {
  /**
   * Match an error message against existing bug-fix notes
   */
  async matchError(userId, errorText) {
    if (!errorText || errorText.length < 3) return [];

    // Get bug-fix and solution notes
    const { data: notes } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .in("category", ["bug-fix", "snippet", "other"])
      .limit(200);

    if (!notes || notes.length === 0) return [];

    // TF-IDF similarity
    const engine = new TFIDFEngine();
    engine.addDocument("__query__", errorText);

    for (const note of notes) {
      const text = `${note.title} ${note.description || ""} ${note.code_snippet || ""}`;
      engine.addDocument(note.id, text);
    }

    engine.computeIDF();

    const matches = notes.map((note) => ({
      _id: note.id,
      id: note.id,
      title: note.title,
      description: note.description,
      codeSnippet: note.code_snippet,
      tags: note.tags || [],
      category: note.category,
      matchScore: Math.round(
        engine.cosineSimilarity("__query__", note.id) * 100,
      ),
    }));

    return matches
      .filter((m) => m.matchScore > 5)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);
  }

  /**
   * Smart suggestions based on recent activity
   */
  async getSuggestions(userId) {
    const { data: recentNotes } = await supabase
      .from("notes")
      .select("tags, category")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (!recentNotes || recentNotes.length === 0) {
      return { suggestedTags: [], focusAreas: [] };
    }

    // Aggregate recent tags
    const tagFreq = {};
    const catFreq = {};
    for (const note of recentNotes) {
      for (const tag of note.tags || []) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
      catFreq[note.category] = (catFreq[note.category] || 0) + 1;
    }

    const suggestedTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    const focusAreas = Object.entries(catFreq)
      .sort((a, b) => b[1] - a[1])
      .map(([category, count]) => ({ category, count }));

    return { suggestedTags, focusAreas };
  }
}

module.exports = new DevMemoryService();
