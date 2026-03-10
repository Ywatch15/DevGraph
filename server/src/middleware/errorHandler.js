/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error("Error:", err.message);

  // Supabase / PostgreSQL errors
  if (err.code && typeof err.code === "string" && err.code.length === 5) {
    // PostgreSQL error codes are 5-char strings
    if (err.code === "23505") {
      // Unique constraint violation
      return res
        .status(409)
        .json({ error: "A record with this value already exists." });
    }
    if (err.code === "23503") {
      // Foreign key violation
      return res
        .status(400)
        .json({ error: "Referenced record does not exist." });
    }
    if (err.code === "23514") {
      // Check constraint violation
      return res
        .status(400)
        .json({ error: "Invalid value for one or more fields." });
    }
  }

  // Validation errors (express-validator)
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body." });
  }

  // Custom errors with statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Fallback
  const statusCode = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message;

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
