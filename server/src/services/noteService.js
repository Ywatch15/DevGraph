const { supabase } = require("../config/supabase");
const { extractTags } = require("../utils/tagExtractor");

class NoteService {
  async create(userId, data) {
    // Auto-extract tags if none provided
    if (!data.tags || data.tags.length === 0) {
      const textContent = `${data.title} ${data.description || ""} ${data.codeSnippet || ""}`;
      data.tags = extractTags(textContent);
    }

    // Normalize tags
    data.tags = [
      ...new Set(data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean)),
    ].slice(0, 20);

    const { data: note, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        title: data.title,
        description: data.description || "",
        code_snippet: data.codeSnippet || "",
        language: data.language || "javascript",
        tags: data.tags,
        source_url: data.sourceUrl || "",
        visibility: data.visibility || "private",
        category: data.category || "other",
      })
      .select()
      .single();

    if (error) {
      const err = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }

    // Tag counts are handled by the database trigger
    return this.formatNote(note);
  }

  async getAll(
    userId,
    {
      page = 1,
      limit = 20,
      tags,
      category,
      visibility,
      sort = "-updatedAt",
    } = {},
  ) {
    let query = supabase
      .from("notes")
      .select("*", { count: "exact" })
      .eq("user_id", userId);

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      query = query.overlaps("tags", tagList);
    }
    if (category) query = query.eq("category", category);
    if (visibility) query = query.eq("visibility", visibility);

    // Sort
    const desc = sort.startsWith("-");
    const sortCol = this.mapSortColumn(sort.replace("-", ""));
    query = query.order(sortCol, { ascending: !desc });

    // Paginate
    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: notes, count, error } = await query;

    if (error) {
      const err = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }

    return {
      notes: (notes || []).map(this.formatNote),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getById(noteId, userId) {
    const { data: note, error } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (error || !note) {
      const err = new Error("Note not found");
      err.statusCode = 404;
      throw err;
    }

    // Check access
    if (note.user_id !== userId && note.visibility !== "public") {
      const err = new Error("Access denied");
      err.statusCode = 403;
      throw err;
    }

    return this.formatNote(note);
  }

  async update(noteId, userId, data) {
    // Check ownership
    const { data: existing, error: findError } = await supabase
      .from("notes")
      .select("id")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single();

    if (findError || !existing) {
      const err = new Error("Note not found");
      err.statusCode = 404;
      throw err;
    }

    // Normalize tags
    if (data.tags) {
      data.tags = [
        ...new Set(
          data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean),
        ),
      ].slice(0, 20);
    }

    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.codeSnippet !== undefined)
      updateData.code_snippet = data.codeSnippet;
    if (data.language !== undefined) updateData.language = data.language;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.sourceUrl !== undefined) updateData.source_url = data.sourceUrl;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.category !== undefined) updateData.category = data.category;

    const { data: note, error } = await supabase
      .from("notes")
      .update(updateData)
      .eq("id", noteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      const err = new Error(error.message);
      err.statusCode = 400;
      throw err;
    }

    // Tag counts updated automatically by trigger
    return this.formatNote(note);
  }

  async delete(noteId, userId) {
    const { data: note, error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !note) {
      const err = new Error("Note not found");
      err.statusCode = 404;
      throw err;
    }

    // Tag counts decremented automatically by trigger
    return this.formatNote(note);
  }

  async getPublicFeed({ page = 1, limit = 20, tags } = {}) {
    let query = supabase
      .from("notes")
      .select("*, profiles!notes_user_id_fkey(name)", { count: "exact" })
      .eq("visibility", "public")
      .order("updated_at", { ascending: false });

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      query = query.overlaps("tags", tagList);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data: notes, count, error } = await query;

    return {
      notes: (notes || []).map((n) => {
        const formatted = this.formatNote(n);
        formatted.userId = n.profiles ? { name: n.profiles.name } : null;
        return formatted;
      }),
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };
  }

  async getUserStats(userId) {
    // Parallel queries
    const [totalRes, publicRes, categoriesRes, recentRes, tagRes, timelineRes] =
      await Promise.all([
        supabase
          .from("notes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("notes")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("visibility", "public"),
        supabase.rpc("get_user_category_counts", { uid: userId }),
        supabase
          .from("notes")
          .select("id, title, tags, category, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(5),
        supabase.rpc("get_user_tag_counts", { uid: userId, lim: 15 }),
        supabase.rpc("get_user_timeline", { uid: userId }),
      ]);

    const total = totalRes.count || 0;
    const publicCount = publicRes.count || 0;

    const categories = {};
    (categoriesRes.data || []).forEach((c) => {
      categories[c.category] = Number(c.count);
    });

    return {
      total,
      publicCount,
      privateCount: total - publicCount,
      categories,
      topTags: (tagRes.data || []).map((t) => ({
        name: t.tag,
        count: Number(t.count),
      })),
      recentNotes: (recentRes.data || []).map(this.formatNote),
      timeline: (timelineRes.data || []).map((t) => ({
        month: t.month,
        count: Number(t.count),
      })),
    };
  }

  // Map frontend field names to Supabase column names
  mapSortColumn(field) {
    const map = {
      updatedAt: "updated_at",
      createdAt: "created_at",
      title: "title",
    };
    return map[field] || "updated_at";
  }

  // Transform Supabase row to frontend-expected shape
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
      relatedNotes: row.related_notes || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  // Get public feed of all users' public notes
  async getPublicFeed({ page = 1, limit = 20, tags } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("notes")
      .select("*", { count: "exact" })
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      query = query.overlaps("tags", tagArray);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    // Look up author names from profiles
    const userIds = [...new Set((data || []).map((n) => n.user_id))];
    const profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);
      for (const p of profiles || []) {
        profileMap[p.id] = p.name || "Anonymous";
      }
    }

    return {
      notes: (data || []).map((row) => ({
        ...this.formatNote(row),
        author: profileMap[row.user_id] || "Anonymous",
      })),
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

}

module.exports = new NoteService();
