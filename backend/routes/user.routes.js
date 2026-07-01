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

// GET /api/users/me/sheet — returns the global sheet URL set by admin (read-only for users)
router.get("/me/sheet", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT value FROM settings WHERE key = 'global_sheet_webhook'");
    res.json({ sheet_webhook: rows[0]?.value || "" });
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
