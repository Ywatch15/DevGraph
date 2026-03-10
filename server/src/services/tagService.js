const { supabase } = require("../config/supabase");

class TagService {
  // Tag counts are now maintained by the database trigger on notes table.
  // These methods are kept for backward compat but are mostly no-ops.

  async updateTagCounts(tags) {
    // No-op: handled by sync_tag_counts trigger
  }

  async decrementTagCounts(tags) {
    // No-op: handled by sync_tag_counts trigger
  }

  async getAll({ page = 1, limit = 50, search } = {}) {
    let query = supabase
      .from("tags")
      .select("*", { count: "exact" })
      .order("usage_count", { ascending: false });

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: tags, count, error } = await query;

    return {
      tags: (tags || []).map(this.formatTag),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async suggest(prefix) {
    let query = supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(10);

    if (prefix && prefix.length >= 1) {
      query = query.ilike("name", `${prefix.toLowerCase()}%`);
    }

    const { data } = await query;
    return (data || []).map(this.formatTag);
  }

  async getPopular(limit = 20) {
    const { data } = await supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(limit);

    return (data || []).map(this.formatTag);
  }

  formatTag(row) {
    return {
      _id: row.id,
      name: row.name,
      usageCount: row.usage_count,
      createdAt: row.created_at,
    };
  }
}

module.exports = new TagService();
