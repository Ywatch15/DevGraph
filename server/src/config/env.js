const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/devgraph",
  jwtSecret: process.env.JWT_SECRET || "devgraph-fallback-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  nodeEnv: process.env.NODE_ENV || "development",
};
