import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Access token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid token",
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: "Authentication failed",
    });
  }
};

export default authMiddleware;
