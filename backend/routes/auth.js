const express = require("express");
const router = express.Router();
const { findByEmail, findByEmployeeId, findById, addUser } = require("../data/users");
const { generateFilename, uploadProfilePicture } = require("../utils/s3");
const upload = require("../middleware/upload");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// POST /api/register
router.post("/register", (req, res, next) => {
  upload.single("profilePicture")(req, res, (err) => {
    if (err) {
      // Multer errors (bad MIME type, file too large, etc.) — never includes file bytes.
      console.warn(`[register] rejected upload: ${err.message}`);
      return res.status(400).json({ error: err.message || "Invalid profile picture" });
    }
    handleRegister(req, res, next);
  });
});

async function handleRegister(req, res, next) {
  try {
    const {
      fullName,
      email,
      phone,
      employeeId,
      department,
      position,
      password,
      confirmPassword
    } = req.body;

    const requiredFields = { fullName, email, phone, employeeId, department, position, password, confirmPassword };
    for (const [key, value] of Object.entries(requiredFields)) {
      if (!value || !String(value).trim()) {
        // Log which field was missing, never the values (password/confirmPassword included).
        console.warn(`[register] 400: missing required field "${key}"`);
        return res.status(400).json({ error: `${key} is required` });
      }
    }

    if (!EMAIL_REGEX.test(email)) {
      console.warn(`[register] 400: invalid email format`);
      return res.status(400).json({ error: "Invalid email address" });
    }

    if (password.length < 6) {
      console.warn(`[register] 400: password too short`);
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if (password !== confirmPassword) {
      console.warn(`[register] 400: password/confirmPassword mismatch`);
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (await findByEmail(email)) {
      console.warn(`[register] 409: duplicate email`);
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    if (await findByEmployeeId(employeeId)) {
      console.warn(`[register] 409: duplicate employeeId`);
      return res.status(409).json({ error: "This Employee ID is already registered" });
    }

    // S3 object key == MySQL image_key, always: whatever filename we upload
    // under is the exact string stored below and returned to the frontend.
    let image_key = null;
    if (req.file) {
      const filename = generateFilename(req.file.originalname);
      await uploadProfilePicture(req.file.buffer, filename, req.file.mimetype);
      image_key = filename;
    }

    const newUser = await addUser({
      employeeId: employeeId.trim(),
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: department.trim(),
      position: position.trim(),
      password,
      image_key
    });

    res.status(201).json({ message: "Account created successfully", user: sanitizeUser(newUser) });
  } catch (err) {
    // Safe to log: MySQL/AWS SDK error metadata never includes the request body
    // (so no password), and we never log err.config/err.$metadata credentials.
    if (err.code === "ER_DUP_ENTRY") {
      console.warn(`[register] 409: duplicate key on insert (${err.sqlMessage || err.code})`);
      return res.status(409).json({ error: "An account with this email or Employee ID already exists" });
    }
    console.error(`[register] 500: ${err.code || err.name || "error"} - ${err.sqlMessage || err.message}`);
    next(err);
  }
}

// POST /api/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await findByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    req.session.userId = user.id;
    res.json({ message: "Login successful", user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /api/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// GET /api/user
router.get("/user", async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = await findById(req.session.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
