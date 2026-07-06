/**
 * server/index.js
 * ----------------------------------------------------------------
 * Express application entry point.
 *
 * Local dev:   npm run dev   → runs this file directly with nodemon
 * Netlify:     this same app is wrapped with serverless-http inside
 *              netlify/functions/api.js — no code duplication.
 * ----------------------------------------------------------------
 */

require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const compression = require("compression");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");

const dataRouter = require("./routes/dataRouter");
const toolsRouter = require("./routes/toolsRouter");

const app = express();

/* ------------------------- Security & perf ------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false, // relaxed for CDN fonts/icons used by the front-end
  })
);
app.use(compression());
app.use(cors());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests, please try again later." },
});
app.use("/api", apiLimiter);

/* ------------------------------- API -------------------------------- */
app.use("/api", dataRouter);
app.use("/api/tools", toolsRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

/* --------------------------- Static assets --------------------------- */
const PUBLIC_DIR = path.join(__dirname, "..", "public");
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));
app.use("/styles", express.static(path.join(__dirname, "..", "src", "styles")));
app.use("/assets", express.static(path.join(__dirname, "..", "src", "assets")));

/* ------------------------------ 404 ------------------------------ */
app.use((req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ success: false, error: "Not found" });
  }
  res.status(404).sendFile(path.join(PUBLIC_DIR, "404.html"));
});

/* --------------------------- Error handler --------------------------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`PIXEL server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
