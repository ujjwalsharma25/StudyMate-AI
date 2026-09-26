import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = express.Router();

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/signup
// Collects the one-time profile details: name, email, password, education
// level, and study goal — used later to personalize the roadmap if you
// want to extend the AI prompt with this context.
router.post("/signup", async (req, res) => {
  const { fullName, email, password, educationLevel, goal } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, education_level, goal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, education_level, goal`,
      [fullName, email, passwordHash, educationLevel || null, goal || null]
    );

    const user = result.rows[0];

    // Create their empty study_data row up front so other routes can
    // assume it always exists.
    await pool.query("INSERT INTO study_data (user_id) VALUES ($1)", [user.id]);

    const token = makeToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        educationLevel: user.education_level,
        goal: user.goal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create account. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = makeToken(user.id);
    res.json({
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        educationLevel: user.education_level,
        goal: user.goal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/auth/me  — used on page reload to restore the session
router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    const jwt = await import("jsonwebtoken");
    const payload = jwt.default.verify(header.split(" ")[1], process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT id, full_name, email, education_level, goal FROM users WHERE id = $1",
      [payload.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "User not found." });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        educationLevel: user.education_level,
        goal: user.goal,
      },
    });
  } catch {
    return res.status(401).json({ error: "Session expired." });
  }
});

export default router;
