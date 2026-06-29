const { pool } = require("../config/db");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM templates WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Template not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, type, content } = req.body;
    const [result] = await pool.query(
      "INSERT INTO templates (user_id, name, type, content) VALUES (?, ?, ?, ?)",
      [req.user.id, name, type, content]
    );
    res.status(201).json({ id: result.insertId, name, type });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, type, content } = req.body;
    await pool.query(
      "UPDATE templates SET name = ?, type = ?, content = ? WHERE id = ? AND user_id = ?",
      [name, type, content, req.params.id, req.user.id]
    );
    res.json({ message: "Template updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query("DELETE FROM templates WHERE id = ? AND user_id = ?", [req.params.id, req.user.id]);
    res.json({ message: "Template deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
