const helmet = require("helmet");
const cors = require("cors");
const xssFilters = require("xss-filters");

const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet());

  // CORS
  const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000,http://localhost:4000")
    .split(",")
    .map((o) => o.trim());

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // XSS protection — sanitize string values in request body
  // Skip code-content fields (codeSnippet, code_snippet, errorText) that are rendered
  // in code editors, not as raw HTML
  const CODE_FIELDS = new Set(["codeSnippet", "code_snippet", "errorText"]);

  app.use((req, res, next) => {
    if (typeof req.body === "object" && req.body !== null) {
      sanitizeObject(req.body, CODE_FIELDS);
    }
    next();
  });
};

function sanitizeObject(obj, skipFields) {
  for (const key in obj) {
    if (skipFields && skipFields.has(key)) continue;
    if (typeof obj[key] === "string") {
      obj[key] = xssFilters.inHTMLData(obj[key]);
    } else if (Array.isArray(obj[key])) {
      obj[key] = obj[key].map((item) => {
        if (typeof item === "string") return xssFilters.inHTMLData(item);
        if (typeof item === "object" && item !== null) sanitizeObject(item, skipFields);
        return item;
      });
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key], skipFields);
    }
  }
}

module.exports = setupSecurity;
