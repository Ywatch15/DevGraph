const { body, param, query, validationResult } = require("express-validator");

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => e.msg),
    });
  }
  next();
};

const registerRules = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  handleValidation,
];

const loginRules = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidation,
];

const noteRules = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title is required (1-200 chars)"),
  body("description")
    .optional()
    .isLength({ max: 50000 })
    .withMessage("Description max 50000 chars"),
  body("codeSnippet")
    .optional()
    .isLength({ max: 100000 })
    .withMessage("Snippet max 100000 chars"),
  body("language").optional().isString().trim(),
  body("tags").optional().isArray({ max: 20 }).withMessage("Max 20 tags"),
  body("visibility").optional().isIn(["private", "public"]),
  body("category")
    .optional()
    .isIn([
      "bug-fix",
      "snippet",
      "architecture",
      "command",
      "config",
      "learning",
      "other",
    ]),
  handleValidation,
];

const noteUpdateRules = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Title 1-200 chars"),
  body("description").optional().isLength({ max: 50000 }),
  body("codeSnippet").optional().isLength({ max: 100000 }),
  body("language").optional().isString().trim(),
  body("tags").optional().isArray({ max: 20 }),
  body("visibility").optional().isIn(["private", "public"]),
  body("category")
    .optional()
    .isIn([
      "bug-fix",
      "snippet",
      "architecture",
      "command",
      "config",
      "learning",
      "other",
    ]),
  handleValidation,
];

const idParamRule = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidation,
];

const searchRules = [
  query("q")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Query max 200 chars"),
  query("tags").optional().trim(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  handleValidation,
];

module.exports = {
  registerRules,
  loginRules,
  noteRules,
  noteUpdateRules,
  idParamRule,
  searchRules,
  handleValidation,
};
