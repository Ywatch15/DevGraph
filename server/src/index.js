const express = require("express");
const config = require("./config/env");
const setupSecurity = require("./middleware/security");
const errorHandler = require("./middleware/errorHandler");

// Routes
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
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    database: "supabase",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/graph", graphRoutes);
app.use("/api/public", publicRoutes);

// Global error handler
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`DevGraph API running on port ${PORT} [${config.nodeEnv}]`);
  console.log(
    `Database: Supabase (${config.supabaseUrl ? "connected" : "NOT CONFIGURED"})`,
  );
});
