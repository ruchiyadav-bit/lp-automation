const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

// GET /api/users/me
router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, features_enabled, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
router.put("/me", authenticate, async (req, res) => {
  try {
    const { name, password } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query("UPDATE users SET name = ?, password = ? WHERE id = ?", [name, hash, req.user.id]);
    } else {
      await pool.query("UPDATE users SET name = ? WHERE id = ?", [name, req.user.id]);
    }
    res.json({ message: "Profile updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me/sheet — current Google Sheet webhook URL
router.get("/me/sheet", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT sheet_webhook FROM users WHERE id = ?", [req.user.id]);
    res.json({ sheet_webhook: rows[0]?.sheet_webhook || "" });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/users/me/sheet — save / clear the Google Sheet webhook URL
router.put("/me/sheet", authenticate, async (req, res) => {
  try {
    const url = (req.body.sheet_webhook || "").trim();
    if (url && !/^https:\/\/script\.google\.com\//i.test(url)) {
      return res.status(400).json({ message: "Enter a valid Google Apps Script Web App URL (https://script.google.com/...)" });
    }
    await pool.query("UPDATE users SET sheet_webhook = ? WHERE id = ?", [url || null, req.user.id]);
    res.json({ message: url ? "Google Sheet connected" : "Disconnected", sheet_webhook: url });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE /api/users/me
router.delete("/me", authenticate, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
