const Note = require("../models/Note");
const Relation = require("../models/Relation");

class GraphService {
  /**
   * Generate relationships based on shared tags and content similarity
   */
  async generateRelations(userId) {
    const notes = await Note.find({ userId })
      .select("title tags description")
      .lean();

    if (notes.length < 2) return { nodes: notes.length, edges: 0 };

    const newRelations = [];

    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const noteA = notes[i];
        const noteB = notes[j];

        // Calculate tag similarity (Jaccard index)
        const tagsA = new Set(noteA.tags || []);
        const tagsB = new Set(noteB.tags || []);
        const intersection = [...tagsA].filter((t) => tagsB.has(t));
        const union = new Set([...tagsA, ...tagsB]);

        if (union.size === 0) continue;

        const similarity = intersection.length / union.size;

        // Threshold for creating a relation
        if (similarity >= 0.15) {
          newRelations.push({
            sourceNoteId: noteA._id,
            targetNoteId: noteB._id,
            relationType: "tag-similarity",
            weight: Math.round(similarity * 100) / 100,
          });
        }
      }
    }

    // Clear old auto-generated relations for this user's notes
    const noteIds = notes.map((n) => n._id);
    await Relation.deleteMany({
      sourceNoteId: { $in: noteIds },
      relationType: { $in: ["tag-similarity", "keyword-similarity"] },
    });

    // Insert new relations
    if (newRelations.length > 0) {
      await Relation.insertMany(newRelations, { ordered: false }).catch(() => {
        // Ignore duplicate key errors
      });
    }

    return { nodes: notes.length, edges: newRelations.length };
  }

  /**
   * Get graph data for visualization
   */
  async getGraph(userId) {
    const notes = await Note.find({ userId })
      .select("title tags category visibility updatedAt")
      .lean();

    const noteIds = notes.map((n) => n._id);

    const relations = await Relation.find({
      $or: [
        { sourceNoteId: { $in: noteIds } },
        { targetNoteId: { $in: noteIds } },
      ],
    }).lean();

    // Build nodes
    const nodes = notes.map((note) => ({
      id: note._id.toString(),
      title: note.title,
      tags: note.tags,
      category: note.category,
      visibility: note.visibility,
      updatedAt: note.updatedAt,
      // Node size based on connections
      connections: 0,
    }));

    // Build edges + count connections
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const edges = relations.map((rel) => {
      const sourceId = rel.sourceNoteId.toString();
      const targetId = rel.targetNoteId.toString();

      if (nodeMap.has(sourceId)) nodeMap.get(sourceId).connections++;
      if (nodeMap.has(targetId)) nodeMap.get(targetId).connections++;

      return {
        source: sourceId,
        target: targetId,
        type: rel.relationType,
        weight: rel.weight,
      };
    });

    return { nodes, edges };
  }
}

module.exports = new GraphService();
