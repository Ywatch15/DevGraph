const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const auth = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiter");
const { registerRules, loginRules } = require("../utils/validators");

// POST /api/auth/register
router.post("/register", registerRules, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post("/login", loginLimiter, loginRules, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get("/me", auth, async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.userId);
    res.json(profile);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
