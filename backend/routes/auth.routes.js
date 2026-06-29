const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate.middleware");
const { authenticate } = require("../middleware/auth.middleware");
const authController = require("../controllers/auth.controller");

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be 8+ characters")
  ],
  validate,
  authController.register
);

router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  validate,
  authController.login
);

router.get("/me", authenticate, authController.me);

module.exports = router;
