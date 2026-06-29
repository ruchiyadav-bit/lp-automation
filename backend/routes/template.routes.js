const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const templateController = require("../controllers/template.controller");

router.get("/", authenticate, templateController.getAll);
router.get("/:id", authenticate, templateController.getById);
router.post("/", authenticate, templateController.create);
router.put("/:id", authenticate, templateController.update);
router.delete("/:id", authenticate, templateController.remove);

module.exports = router;
