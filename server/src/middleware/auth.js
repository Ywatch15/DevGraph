const jwt = require("jsonwebtoken");
const config = require("../config/env");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, config.jwtSecret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: "User not found. Token invalid." });
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Token expired. Please login again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token." });
    }
    return res.status(500).json({ error: "Authentication failed." });
  }
};

module.exports = auth;
