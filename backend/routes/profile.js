const express = require("express");
const router = express.Router();
const { findById } = require("../data/users");
const { requireAuth } = require("../middleware/auth");

function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

// GET /api/profile
router.get("/profile", requireAuth, async (req, res, next) => {
  try {
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
