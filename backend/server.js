
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const Database = require("better-sqlite3");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Set a strong JWT_SECRET in backend/.env");
}

const db = new Database(path.join(__dirname, "bizpilot.db"));
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

app.use(helmet());
const allowedOrigins = [
  "https://edirisinghekinurimahoshadhi-debug.github.io"
];

app.use(cors({
  origin: allowedOrigins
}));
app.use(express.json({ limit: "10kb" }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.get("/", (req, res) => {
  res.json({
    project: "KME BizPilot",
    status: "success",
    message: "Backend is running!"
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "healthy" });
});

app.post("/api/auth/register", authLimiter, async (req, res) => {
  try {
    const { name, email, password, role } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      typeof role !== "string"
    ) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 80) {
      return res.status(400).json({ error: "Name must be 2–80 characters." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) {
      return res.status(400).json({ error: "Please enter a valid email." });
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({
        error: "Password must be at least 8 characters and no more than 72 bytes."
      });
    }

    if (!["owner", "customer"].includes(role)) {
      return res.status(400).json({ error: "Role must be owner or customer." });
    }

    const existing = db.prepare(
      "SELECT id FROM users WHERE email = ?"
    ).get(cleanEmail);

    if (existing) {
      return res.status(409).json({ error: "Unable to register with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(cleanName, cleanEmail, passwordHash, role);

    return res.status(201).json({
      message: "Account created successfully.",
      user: {
        id: result.lastInsertRowid,
        name: cleanName,
        email: cleanEmail,
        role
      }
    });
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "Unable to register with this email." });
    }

    console.error("Registration error:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      email.length > 254 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = db.prepare(`
      SELECT id, name, email, password_hash, role
      FROM users
      WHERE email = ?
    `).get(cleanEmail);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { role: user.role },
      process.env.JWT_SECRET,
      { subject: String(user.id), expiresIn: "1h", algorithm: "HS256" }
    );

    return res.json({
      message: "Login successful.",
      token,
      expiresIn: 3600,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Something went wrong." });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`KME BizPilot API running on port ${PORT}`);
});

