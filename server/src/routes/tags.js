const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const tagService = require("../services/tagService");

// GET /api/tags
router.get("/", auth, async (req, res, next) => {
  try {
    const { page, limit, search } = req.query;
    const result = await tagService.getAll({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      search,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/tags/suggest
router.get("/suggest", auth, async (req, res, next) => {
  try {
    const tags = await tagService.suggest(req.query.q);
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

// GET /api/tags/popular
router.get("/popular", auth, async (req, res, next) => {
  try {
    const tags = await tagService.getPopular(parseInt(req.query.limit) || 20);
    res.json(tags);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
