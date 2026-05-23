import supabase from "../lib/supabase.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    if (!data.user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

export default authMiddleware;
