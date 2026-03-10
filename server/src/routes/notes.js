const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const noteService = require("../services/noteService");
const relatedService = require("../services/relatedService");
const searchService = require("../services/searchService");
const {
  noteRules,
  noteUpdateRules,
  idParamRule,
} = require("../utils/validators");

// POST /api/notes
router.post("/", auth, noteRules, async (req, res, next) => {
  try {
    const note = await noteService.create(req.userId, req.body);
    // Update search index
    searchService.addToIndex(note);
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// GET /api/notes
router.get("/", auth, async (req, res, next) => {
  try {
    const { page, limit, tags, category, visibility, sort } = req.query;
    const result = await noteService.getAll(req.userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      tags,
      category,
      visibility,
      sort,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/stats
router.get("/stats", auth, async (req, res, next) => {
  try {
    const stats = await noteService.getUserStats(req.userId);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/:id
router.get("/:id", auth, idParamRule, async (req, res, next) => {
  try {
    const note = await noteService.getById(req.params.id, req.userId);
    res.json(note);
  } catch (error) {
    next(error);
  }
});

// GET /api/notes/:id/related
router.get("/:id/related", auth, idParamRule, async (req, res, next) => {
  try {
    const related = await relatedService.getRelated(req.params.id, req.userId);
    res.json(related);
  } catch (error) {
    next(error);
  }
});

// PUT /api/notes/:id
router.put(
  "/:id",
  auth,
  idParamRule,
  noteUpdateRules,
  async (req, res, next) => {
    try {
      const note = await noteService.update(
        req.params.id,
        req.userId,
        req.body,
      );
      searchService.addToIndex(note);
      res.json(note);
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/notes/:id
router.delete("/:id", auth, idParamRule, async (req, res, next) => {
  try {
    const note = await noteService.delete(req.params.id, req.userId);
    searchService.removeFromIndex(note._id);
    res.json({ message: "Note deleted" });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
