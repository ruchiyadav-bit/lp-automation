const { pool } = require("../config/db");
const ExcelJS = require("exceljs");

exports.capture = async (req, res) => {
  try {
    const { page_id, email, redirect_url } = req.body;
    if (!page_id || !email) return res.status(400).json({ message: "page_id and email required" });

    const [pages] = await pool.query("SELECT id FROM pages WHERE id = ?", [page_id]);
    if (!pages.length) return res.status(404).json({ message: "Page not found" });

    const cleanEmail = email.toLowerCase().trim();
    await pool.query(
      "INSERT IGNORE INTO emails (page_id, email) VALUES (?, ?)",
      [page_id, cleanEmail]
    );

    // If the page owner connected a Google Sheet (Apps Script webhook), append
    // the email to it. Fire-and-forget so it never blocks the visitor's submit.
    try {
      const [owner] = await pool.query(
        "SELECT p.sheet_webhook AS page_hook, u.sheet_webhook AS user_hook FROM pages p JOIN users u ON u.id = p.user_id WHERE p.id = ?",
        [page_id]
      );
      // Per-page sheet (the newsletter's "Connect with Sheet") wins; else the
      // account-wide sheet set on the dashboard.
      const hook = owner[0]?.page_hook || owner[0]?.user_hook;
      if (hook) {
        fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, page_id, timestamp: new Date().toISOString() })
        }).catch(() => {});
      }
    } catch (e) { /* ignore sheet errors */ }

    if (redirect_url) return res.json({ redirect: redirect_url });
    res.status(201).json({ message: "Subscribed" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getByPage = async (req, res) => {
  try {
    const [pages] = await pool.query(
      "SELECT id FROM pages WHERE id=? AND user_id=?",
      [req.params.pageId, req.user.id]
    );
    if (!pages.length) return res.status(403).json({ message: "Not authorised" });

    const [rows] = await pool.query(
      "SELECT id, email, created_at FROM emails WHERE page_id=? ORDER BY created_at DESC",
      [req.params.pageId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.stats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id AS page_id, p.type, p.domain, COUNT(e.id) AS email_count
       FROM pages p LEFT JOIN emails e ON e.page_id = p.id
       WHERE p.user_id = ? GROUP BY p.id`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Export as Excel
exports.exportExcel = async (req, res) => {
  try {
    const [pages] = await pool.query(
      "SELECT id, domain FROM pages WHERE id=? AND user_id=?",
      [req.params.pageId, req.user.id]
    );
    if (!pages.length) return res.status(403).json({ message: "Not authorised" });

    const [rows] = await pool.query(
      "SELECT email, created_at FROM emails WHERE page_id=? ORDER BY created_at DESC",
      [req.params.pageId]
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Subscribers");
    ws.columns = [
      { header: "Email", key: "email", width: 35 },
      { header: "Subscribed At", key: "created_at", width: 25 }
    ];
    ws.getRow(1).font = { bold: true };
    rows.forEach(r => ws.addRow({ email: r.email, created_at: new Date(r.created_at).toLocaleString() }));

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers-page-${req.params.pageId}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Export as CSV
exports.exportCsv = async (req, res) => {
  try {
    const [pages] = await pool.query(
      "SELECT id FROM pages WHERE id=? AND user_id=?",
      [req.params.pageId, req.user.id]
    );
    if (!pages.length) return res.status(403).json({ message: "Not authorised" });

    const [rows] = await pool.query(
      "SELECT email, created_at FROM emails WHERE page_id=? ORDER BY created_at DESC",
      [req.params.pageId]
    );

    const csv = ["email,subscribed_at", ...rows.map(r => `${r.email},${new Date(r.created_at).toISOString()}`)].join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="subscribers-page-${req.params.pageId}.csv"`);
    res.send(csv);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
