const express = require("express");
const router = express.Router();
const noteService = require("../services/noteService");

// GET /api/public/feed — public knowledge feed (no auth required)
router.get("/feed", async (req, res, next) => {
  try {
    const { page, limit, tags } = req.query;
    const result = await noteService.getPublicFeed({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      tags,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
