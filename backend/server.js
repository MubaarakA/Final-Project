require("dotenv").config();
const path = require("path");
const express = require("express");
const session = require("express-session");

const pool = require("./config/db");
const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8 hours
  })
);

// Static frontend assets
app.use(express.static(path.join(__dirname, "..", "frontend")));

// API routes
app.use("/api", authRoutes);
app.use("/api", profileRoutes);

// Page routes
const pages = ["", "register", "login", "home", "profile"];
pages.forEach((page) => {
  const route = page === "" ? "/" : `/${page}`;
  const file = page === "" ? "index.html" : `${page}.html`;
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", file));
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, req, res, next) => {
  // err.stack/err.code/err.sqlMessage are safe to log: mysql2 uses parameterized
  // queries (placeholders only, never real values) and never embeds credentials here.
  console.error(`[error] ${req.method} ${req.path} -> ${err.code || err.name || "Error"}: ${err.sqlMessage || err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    await pool.query("SELECT 1");
    console.log(`Connected to MySQL at ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
  } catch (err) {
    console.error("Failed to connect to MySQL:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Employee Management System running at http://localhost:${PORT}`);
  });
}

start();
