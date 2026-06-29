const router = require("express").Router();
const { authenticate } = require("../middleware/auth.middleware");
const pageController = require("../controllers/page.controller");

router.get("/",           authenticate, pageController.getAll);
router.get("/:id",        authenticate, pageController.getById);
router.get("/:id/download", authenticate, pageController.download);
router.post("/",          authenticate, pageController.create);
router.put("/:id",        authenticate, pageController.update);
router.delete("/:id",     authenticate, pageController.remove);

module.exports = router;
