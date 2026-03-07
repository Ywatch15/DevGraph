const Tag = require("../models/Tag");

class TagService {
  async updateTagCounts(tags) {
    if (!tags || tags.length === 0) return;

    const ops = tags.map((name) => ({
      updateOne: {
        filter: { name: name.toLowerCase() },
        update: {
          $inc: { usageCount: 1 },
          $setOnInsert: { name: name.toLowerCase() },
        },
        upsert: true,
      },
    }));

    await Tag.bulkWrite(ops);
  }

  async decrementTagCounts(tags) {
    if (!tags || tags.length === 0) return;

    const ops = tags.map((name) => ({
      updateOne: {
        filter: { name: name.toLowerCase() },
        update: { $inc: { usageCount: -1 } },
      },
    }));

    await Tag.bulkWrite(ops);

    // Clean up tags with 0 or negative count
    await Tag.deleteMany({ usageCount: { $lte: 0 } });
  }

  async getAll({ page = 1, limit = 50, search } = {}) {
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;
    const [tags, total] = await Promise.all([
      Tag.find(query).sort("-usageCount").skip(skip).limit(limit).lean(),
      Tag.countDocuments(query),
    ]);

    return {
      tags,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async suggest(prefix) {
    if (!prefix || prefix.length < 1) {
      return Tag.find().sort("-usageCount").limit(10).lean();
    }

    return Tag.find({
      name: { $regex: `^${prefix.toLowerCase()}`, $options: "i" },
    })
      .sort("-usageCount")
      .limit(10)
      .lean();
  }

  async getPopular(limit = 20) {
    return Tag.find().sort("-usageCount").limit(limit).lean();
  }
}

module.exports = new TagService();
