const jwt = require("jsonwebtoken");

// Use the provided Supabase JWT secret
const JWT_SECRET = "c056e7cc-f2f4-4cc4-a246-a5dbc91da572";

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    return res.status(401).json({ success: false, error: "Unauthorized: Invalid token" });
  }
};

module.exports = authMiddleware;
