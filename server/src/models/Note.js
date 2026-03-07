const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [50000, "Description cannot exceed 50000 characters"],
    },
    codeSnippet: {
      type: String,
      default: "",
      maxlength: [100000, "Code snippet cannot exceed 100000 characters"],
    },
    language: {
      type: String,
      default: "javascript",
      trim: true,
      lowercase: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags) {
          return tags.length <= 20;
        },
        message: "Cannot have more than 20 tags per note",
      },
    },
    references: {
      type: [String],
      default: [],
    },
    sourceUrl: {
      type: String,
      default: "",
      trim: true,
    },
    visibility: {
      type: String,
      enum: ["private", "public"],
      default: "private",
    },
    category: {
      type: String,
      enum: [
        "bug-fix",
        "snippet",
        "architecture",
        "command",
        "config",
        "learning",
        "other",
      ],
      default: "other",
    },
    relatedNotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Note",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Text index for search
noteSchema.index(
  {
    title: "text",
    description: "text",
    codeSnippet: "text",
    tags: "text",
  },
  {
    weights: {
      title: 10,
      tags: 8,
      description: 5,
      codeSnippet: 2,
    },
    name: "note_text_index",
  },
);

// Compound index for user queries
noteSchema.index({ userId: 1, updatedAt: -1 });
noteSchema.index({ userId: 1, visibility: 1 });
noteSchema.index({ visibility: 1, updatedAt: -1 });
noteSchema.index({ tags: 1 });

module.exports = mongoose.model("Note", noteSchema);
