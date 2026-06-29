const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { signToken } = require("../config/jwt");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, features_enabled) VALUES (?, ?, ?, 'user', ?)",
      [name, email, hash, JSON.stringify({ cookie_banner: true, age_gate: true, email_newsletter: true })]
    );

    const token = signToken({ id: result.insertId, email, role: "user" });
    res.status(201).json({
      token,
      user: { id: result.insertId, name, email, role: "user" }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        features_enabled: user.features_enabled
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, features_enabled, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
