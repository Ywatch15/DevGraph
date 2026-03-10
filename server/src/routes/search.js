const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { searchLimiter } = require("../middleware/rateLimiter");
const searchService = require("../services/searchService");
const devMemoryService = require("../services/devMemoryService");
const { searchRules } = require("../utils/validators");

// GET /api/search
router.get("/", auth, searchLimiter, searchRules, async (req, res, next) => {
  try {
    const { q, tags, page, limit } = req.query;
    const result = await searchService.search(req.userId, {
      q,
      tags,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/search/error-match
router.post("/error-match", auth, async (req, res, next) => {
  try {
    const { errorText } = req.body;
    if (!errorText || errorText.trim().length < 3) {
      return res
        .status(400)
        .json({ error: "Error text must be at least 3 characters" });
    }
    const results = await devMemoryService.matchError(req.userId, errorText);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// POST /api/search/suggest
router.post("/suggest", auth, async (req, res, next) => {
  try {
    const { text } = req.body;
    const results = await devMemoryService.getSuggestions(req.userId, text);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
