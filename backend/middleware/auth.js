import jwt from "jsonwebtoken";

/**
 * Reads "Authorization: Bearer <token>" header, verifies it, and attaches
 * req.userId for downstream routes. Rejects the request if missing/invalid.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in." });
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
