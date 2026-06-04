const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth, requireAdmin } = require("../middleware/auth");

function makeToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: makeToken(user._id), user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => {
  const { _id, name, email, isAdmin } = req.user;
  res.json({ id: _id, name, email, isAdmin });
});

// POST /api/auth/users — admin creates a user directly
router.post("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const user = await User.create({ name, email, password });
    res.status(201).json({ id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/users — admin: list all users
router.get("/users", requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/auth/users/:id — admin: remove a user
router.delete("/users/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/password — change own password
router.put("/password", requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both fields required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    const user = await User.findById(req.user._id);
    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
    user.password = newPassword;
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
