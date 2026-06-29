const { pool } = require("../config/db");
const archiver = require("archiver");

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, user_id, type, domain, created_at, updated_at FROM pages WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pages WHERE id = ? AND user_id = ?",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Page not found" });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { type, domain, html_content, sheet_webhook } = req.body;
    const hook = (sheet_webhook || "").trim() || null;
    // One save slot per project: a project is identified by (user, type, name).
    // Re-saving the same project name overrides the existing record instead of
    // creating a duplicate in page history.
    if (domain) {
      const [existing] = await pool.query(
        "SELECT id FROM pages WHERE user_id = ? AND type = ? AND domain = ?",
        [req.user.id, type, domain]
      );
      if (existing.length) {
        await pool.query("UPDATE pages SET html_content = ?, sheet_webhook = ? WHERE id = ?", [html_content, hook, existing[0].id]);
        return res.status(200).json({ id: existing[0].id, type, domain, updated: true });
      }
    }
    const [result] = await pool.query(
      "INSERT INTO pages (user_id, type, domain, html_content, sheet_webhook) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, type, domain || null, html_content, hook]
    );
    res.status(201).json({ id: result.insertId, type, domain });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { type, domain, html_content } = req.body;
    const [result] = await pool.query(
      "UPDATE pages SET type=?, domain=?, html_content=? WHERE id=? AND user_id=?",
      [type, domain || null, html_content, req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Page not found" });
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    const [result] = await pool.query(
      "DELETE FROM pages WHERE id=? AND user_id=?",
      [req.params.id, req.user.id]
    );
    if (!result.affectedRows) return res.status(404).json({ message: "Page not found" });
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ZIP download
exports.download = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM pages WHERE id=? AND user_id=?",
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Page not found" });
    const page = rows[0];
    const filename = `${page.type}-${page.id}`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);
    archive.append(page.html_content, { name: "index.html" });
    await archive.finalize();
  } catch (err) { res.status(500).json({ message: err.message }); }
};
