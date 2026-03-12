const { supabase } = require("../config/supabase");

/**
 * Authentication middleware using Supabase Auth.
 * Expects: Authorization: Bearer <supabase_access_token>
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify the token with Supabase (retry once on transient network errors)
    let data, error;
    for (let attempt = 0; attempt < 2; attempt++) {
      ({ data, error } = await supabase.auth.getUser(token));
      if (!error || !error.message?.includes("fetch failed")) break;
      await new Promise((r) => setTimeout(r, 500));
    }

    if (error || !data?.user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    req.user = {
      id: data.user.id,
      _id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || "",
    };
    req.userId = data.user.id;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ error: "Authentication failed." });
  }
};

module.exports = auth;
