require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { testConnection } = require("./config/db");

const authRoutes         = require("./routes/auth.routes");
const userRoutes         = require("./routes/user.routes");
const pageRoutes         = require("./routes/page.routes");
const emailCaptureRoutes = require("./routes/email-capture.routes");
const generateRoutes     = require("./routes/generate.routes");
const adminRoutes        = require("./routes/admin.routes");
const templateRoutes     = require("./routes/template.routes");

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/pages",    pageRoutes);
app.use("/api/emails",   emailCaptureRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/admin",    adminRoutes);
app.use("/api/templates", templateRoutes);

app.get("/health", (_req, res) => res.json({ status: "ok", ts: new Date() }));

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

testConnection()
  .then(() => {
    app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    // Don't hard-crash — start anyway so the app/login page stays reachable.
    console.error("⚠️  DB init issue:", err.message);
    app.listen(PORT, () => console.log(`⚠️  Server running (DB unavailable) on http://localhost:${PORT}`));
  });
