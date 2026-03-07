const express = require("express");
const connectDB = require("./config/db");
const config = require("./config/env");
const setupSecurity = require("./middleware/security");
const errorHandler = require("./middleware/errorHandler");
const { apiLimiter } = require("./middleware/rateLimiter");

// Route imports
const authRoutes = require("./routes/auth");
const noteRoutes = require("./routes/notes");
const tagRoutes = require("./routes/tags");
const searchRoutes = require("./routes/search");
const graphRoutes = require("./routes/graph");
const publicRoutes = require("./routes/public");

const app = express();

// Security middleware
setupSecurity(app);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limiting
app.use("/api/", apiLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/public", publicRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(
      `DevGraph API running on port ${config.port} [${config.nodeEnv}]`,
    );
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

module.exports = app;
