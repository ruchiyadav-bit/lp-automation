const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const generateController = require("../controllers/generate.controller");

router.post("/", authenticate, generateController.generate);
router.post("/landing", authenticate, generateController.generateLanding);

module.exports = router;
