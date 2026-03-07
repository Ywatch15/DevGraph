const helmet = require("helmet");
const cors = require("cors");

const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // Body parser limits for XSS protection
  app.use((req, res, next) => {
    if (typeof req.body === "object" && req.body !== null) {
      sanitizeObject(req.body);
    }
    next();
  });
};

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      // Basic XSS sanitization — strip script tags
      obj[key] = obj[key]
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=\s*"[^"]*"/gi, "")
        .replace(/on\w+\s*=\s*'[^']*'/gi, "");
    } else if (typeof obj[key] === "object" && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = setupSecurity;
