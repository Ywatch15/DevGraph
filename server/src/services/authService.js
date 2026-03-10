const { supabase } = require("../config/supabase");

class AuthService {
  async register({ name, email, password }) {
    // Sign up via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: { name },
      },
    });

    if (authError) {
      const error = new Error(authError.message);
      error.statusCode = authError.status || 400;
      throw error;
    }

    const user = authData.user;
    const session = authData.session;

    return {
      user: {
        _id: user.id,
        id: user.id,
        name: user.user_metadata?.name || name,
        email: user.email,
        createdAt: user.created_at,
      },
      token: session?.access_token || "",
    };
  }

  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });

    if (error) {
      const err = new Error("Invalid email or password");
      err.statusCode = 401;
      throw err;
    }

    const user = data.user;
    return {
      user: {
        _id: user.id,
        id: user.id,
        name: user.user_metadata?.name || "",
        email: user.email,
        createdAt: user.created_at,
      },
      token: data.session.access_token,
    };
  }

  async getProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      const err = new Error("User not found");
      err.statusCode = 404;
      throw err;
    }

    return {
      _id: data.id,
      id: data.id,
      name: data.name,
      email: data.email,
      createdAt: data.created_at,
    };
  }
}

module.exports = new AuthService();
