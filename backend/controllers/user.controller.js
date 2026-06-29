const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name, email, created_at FROM users WHERE id = ?", [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMe = async (req, res) => {
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
};

exports.deleteMe = async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
