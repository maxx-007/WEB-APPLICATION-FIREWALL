const express = require("express");
const User = require("../models/user");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

const router = express.Router();

// Create user (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already exists" });

    const newUser = new User({ username, password, role: role || "user", createdBy: req.user.id });
    await newUser.save();

    res.status(201).json({ message: "User created", user: { id: newUser._id, username: newUser.username, role: newUser.role } });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all users (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

// Delete user (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
