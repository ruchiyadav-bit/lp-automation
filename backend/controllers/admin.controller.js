const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");

exports.getStats = async (req, res) => {
  try {
    const [[{ total_users }]]  = await pool.query("SELECT COUNT(*) AS total_users FROM users");
    const [[{ total_pages }]]  = await pool.query("SELECT COUNT(*) AS total_pages FROM pages");
    const [[{ total_emails }]] = await pool.query("SELECT COUNT(*) AS total_emails FROM emails");
    res.json({ total_users, total_pages, total_emails });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name, email, role, features_enabled, created_at FROM users ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role = "user" } = req.body;
    const [existing] = await pool.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(409).json({ message: "Email already in use" });

    const hash = await bcrypt.hash(password, 12);
    const defaultFeatures = JSON.stringify({ ai_generation: true, custom_templates: true, email_export: true, analytics: true });
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, features_enabled) VALUES (?,?,?,?,?)",
      [name, email, hash, role, defaultFeatures]
    );
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    if (password) {
      const hash = await bcrypt.hash(password, 12);
      await pool.query("UPDATE users SET name=?,email=?,role=?,password=? WHERE id=?", [name, email, role, hash, req.params.id]);
    } else {
      await pool.query("UPDATE users SET name=?,email=?,role=? WHERE id=?", [name, email, role, req.params.id]);
    }
    res.json({ message: "User updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (Number(req.params.id) === req.user.id) return res.status(400).json({ message: "Cannot delete yourself" });
    await pool.query("DELETE FROM users WHERE id=?", [req.params.id]);
    res.json({ message: "User deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleFeatures = async (req, res) => {
  try {
    const { features_enabled } = req.body;
    await pool.query("UPDATE users SET features_enabled=? WHERE id=?", [JSON.stringify(features_enabled), req.params.id]);
    res.json({ message: "Features updated", features_enabled });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getGlobalSheet = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT value FROM settings WHERE key = 'global_sheet_webhook'");
    res.json({ sheet_webhook: rows[0]?.value || "" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setGlobalSheet = async (req, res) => {
  try {
    const url = (req.body.sheet_webhook || "").trim();
    if (url && !/^https:\/\/script\.google\.com\//i.test(url)) {
      return res.status(400).json({ message: "Enter a valid Google Apps Script Web App URL (https://script.google.com/...)" });
    }
    await pool.query("INSERT INTO settings (key, value) VALUES ('global_sheet_webhook', ?) ON CONFLICT(key) DO UPDATE SET value = ?", [url || null, url || null]);
    res.json({ message: url ? "Google Sheet connected" : "Disconnected", sheet_webhook: url });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
