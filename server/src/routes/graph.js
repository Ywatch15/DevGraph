const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const graphService = require("../services/graphService");
const devMemoryService = require("../services/devMemoryService");

// GET /api/graph
router.get("/", auth, async (req, res, next) => {
  try {
    const graph = await graphService.getGraph(req.userId);
    res.json(graph);
  } catch (error) {
    next(error);
  }
});

// POST /api/graph/generate
router.post("/generate", auth, async (req, res, next) => {
  try {
    const result = await graphService.generateRelations(req.userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/graph/patterns
router.get("/patterns", auth, async (req, res, next) => {
  try {
    const patterns = await devMemoryService.getPatterns(req.userId);
    res.json(patterns);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
