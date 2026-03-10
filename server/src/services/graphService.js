const { supabase } = require("../config/supabase");

class GraphService {
  async generateRelations(userId) {
    // Get all user notes
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, tags, category")
      .eq("user_id", userId);

    if (!notes || notes.length < 2) return { nodes: 0, edges: 0 };

    // Delete existing relations for this user's notes
    const noteIds = notes.map((n) => n.id);
    await supabase.from("relations").delete().in("source_id", noteIds);

    // Compute Jaccard similarity between all pairs
    const relations = [];
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i];
        const b = notes[j];

        const tagsA = new Set(a.tags || []);
        const tagsB = new Set(b.tags || []);

        if (tagsA.size === 0 && tagsB.size === 0) continue;

        const intersection = [...tagsA].filter((t) => tagsB.has(t)).length;
        const union = new Set([...tagsA, ...tagsB]).size;
        const similarity = union > 0 ? intersection / union : 0;

        if (similarity > 0.15) {
          relations.push({
            source_id: a.id,
            target_id: b.id,
            relation_type: "similar",
            weight: parseFloat(similarity.toFixed(3)),
          });
        }
      }
    }

    // Bulk insert with ON CONFLICT
    if (relations.length > 0) {
      await supabase
        .from("relations")
        .upsert(relations, { onConflict: "source_id,target_id" });
    }

    return { nodes: notes.length, edges: relations.length };
  }

  async getGraph(userId) {
    const { data: notes } = await supabase
      .from("notes")
      .select("id, title, tags, category")
      .eq("user_id", userId);

    if (!notes) return { nodes: [], edges: [] };

    const noteIds = notes.map((n) => n.id);

    const { data: relations } = await supabase
      .from("relations")
      .select("*")
      .in("source_id", noteIds.length > 0 ? noteIds : ["__none__"]);

    // Count connections per node
    const connectionCount = {};
    for (const r of relations || []) {
      connectionCount[r.source_id] = (connectionCount[r.source_id] || 0) + 1;
      connectionCount[r.target_id] = (connectionCount[r.target_id] || 0) + 1;
    }

    return {
      nodes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        tags: n.tags || [],
        category: n.category,
        connections: connectionCount[n.id] || 0,
      })),
      edges: (relations || []).map((r) => ({
        source: r.source_id,
        target: r.target_id,
        weight: r.weight,
        type: r.relation_type,
      })),
    };
  }

  async getPatterns(userId) {
    const { data: notes } = await supabase
      .from("notes")
      .select("tags, category, language")
      .eq("user_id", userId);

    if (!notes) return { topTech: [], topCategories: [], topLanguages: [] };

    // Tag frequency
    const tagCount = {};
    for (const n of notes) {
      for (const t of n.tags || []) {
        tagCount[t] = (tagCount[t] || 0) + 1;
      }
    }
    const topTech = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Category frequency
    const catCount = {};
    for (const n of notes) {
      catCount[n.category] = (catCount[n.category] || 0) + 1;
    }
    const topCategories = Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    // Language frequency
    const langCount = {};
    for (const n of notes) {
      if (n.language) langCount[n.language] = (langCount[n.language] || 0) + 1;
    }
    const topLanguages = Object.entries(langCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return { topTech, topCategories, topLanguages };
  }
}

module.exports = new GraphService();
