const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [50, "Tag name cannot exceed 50 characters"],
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

tagSchema.index({ usageCount: -1 });

module.exports = mongoose.model("Tag", tagSchema);
