const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const c = require("../controllers/email-capture.controller");

router.post("/capture",                       c.capture);
router.get("/stats",             authenticate, c.stats);
router.get("/:pageId",           authenticate, c.getByPage);
// Export endpoints — also accept token from query string for direct window.open() downloads
const authenticateOrQuery = (req, res, next) => {
  if (!req.headers.authorization && req.query.token) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  return require("../middleware/auth.middleware").authenticate(req, res, next);
};
router.get("/:pageId/export/xlsx", authenticateOrQuery, c.exportExcel);
router.get("/:pageId/export/csv",  authenticateOrQuery, c.exportCsv);

module.exports = router;
