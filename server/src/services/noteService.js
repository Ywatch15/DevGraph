const Note = require("../models/Note");
const tagService = require("./tagService");
const { extractTags } = require("../utils/tagExtractor");

class NoteService {
  async create(userId, data) {
    // Auto-extract tags from content if none provided
    if (!data.tags || data.tags.length === 0) {
      const textContent = `${data.title} ${data.description || ""} ${data.codeSnippet || ""}`;
      data.tags = extractTags(textContent);
    }

    // Normalize tags
    data.tags = data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
    data.tags = [...new Set(data.tags)].slice(0, 20);

    const note = await Note.create({ ...data, userId });

    // Update tag usage counts
    await tagService.updateTagCounts(data.tags);

    return note;
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
    const query = { userId };

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      query.tags = { $in: tagList };
    }
    if (category) query.category = category;
    if (visibility) query.visibility = visibility;

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      Note.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Note.countDocuments(query),
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getById(noteId, userId) {
    const note = await Note.findById(noteId).lean();

    if (!note) {
      const error = new Error("Note not found");
      error.statusCode = 404;
      throw error;
    }

    // Check access: must be owner or note must be public
    if (
      note.userId.toString() !== userId.toString() &&
      note.visibility !== "public"
    ) {
      const error = new Error("Access denied");
      error.statusCode = 403;
      throw error;
    }

    return note;
  }

  async update(noteId, userId, data) {
    const note = await Note.findOne({ _id: noteId, userId });
    if (!note) {
      const error = new Error("Note not found");
      error.statusCode = 404;
      throw error;
    }

    // If tags changed, normalize them
    if (data.tags) {
      const oldTags = note.tags;
      data.tags = data.tags.map((t) => t.toLowerCase().trim()).filter(Boolean);
      data.tags = [...new Set(data.tags)].slice(0, 20);

      // Update tag counts
      await tagService.decrementTagCounts(oldTags);
      await tagService.updateTagCounts(data.tags);
    }

    Object.assign(note, data);
    await note.save();
    return note;
  }

  async delete(noteId, userId) {
    const note = await Note.findOneAndDelete({ _id: noteId, userId });
    if (!note) {
      const error = new Error("Note not found");
      error.statusCode = 404;
      throw error;
    }

    // Decrement tag counts
    await tagService.decrementTagCounts(note.tags);
    return note;
  }

  async getPublicFeed({ page = 1, limit = 20, tags } = {}) {
    const query = { visibility: "public" };
    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim().toLowerCase());
      query.tags = { $in: tagList };
    }

    const skip = (page - 1) * limit;
    const [notes, total] = await Promise.all([
      Note.find(query)
        .sort("-updatedAt")
        .skip(skip)
        .limit(limit)
        .populate("userId", "name")
        .lean(),
      Note.countDocuments(query),
    ]);

    return {
      notes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getUserStats(userId) {
    const [total, publicCount, categories, recentNotes] = await Promise.all([
      Note.countDocuments({ userId }),
      Note.countDocuments({ userId, visibility: "public" }),
      Note.aggregate([
        {
          $match: {
            userId: require("mongoose").Types.ObjectId.createFromHexString(
              userId.toString(),
            ),
          },
        },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),
      Note.find({ userId })
        .sort("-updatedAt")
        .limit(5)
        .select("title tags category updatedAt")
        .lean(),
    ]);

    // Tag frequency
    const tagPipeline = await Note.aggregate([
      {
        $match: {
          userId: require("mongoose").Types.ObjectId.createFromHexString(
            userId.toString(),
          ),
        },
      },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
    ]);

    // Timeline data (notes per month)
    const timeline = await Note.aggregate([
      {
        $match: {
          userId: require("mongoose").Types.ObjectId.createFromHexString(
            userId.toString(),
          ),
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    return {
      total,
      publicCount,
      privateCount: total - publicCount,
      categories: categories.reduce((acc, c) => {
        acc[c._id] = c.count;
        return acc;
      }, {}),
      topTags: tagPipeline.map((t) => ({ name: t._id, count: t.count })),
      recentNotes,
      timeline: timeline.map((t) => ({
        month: `${t._id.year}-${String(t._id.month).padStart(2, "0")}`,
        count: t.count,
      })),
    };
  }
}

module.exports = new NoteService();
