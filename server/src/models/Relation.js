const mongoose = require("mongoose");

const relationSchema = new mongoose.Schema({
  sourceNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
  },
  targetNoteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Note",
    required: true,
  },
  relationType: {
    type: String,
    enum: [
      "tag-similarity",
      "keyword-similarity",
      "manual",
      "content-similarity",
    ],
    default: "tag-similarity",
  },
  weight: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

relationSchema.index({ sourceNoteId: 1 });
relationSchema.index({ targetNoteId: 1 });
relationSchema.index({ sourceNoteId: 1, targetNoteId: 1 }, { unique: true });

module.exports = mongoose.model("Relation", relationSchema);
