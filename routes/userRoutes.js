const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  updateUser,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
const User = require("../models/User");

router.get("/", protect, admin, getAllUsers);
router.put("/:id", protect, admin, updateUser);
router.delete("/:id", protect, admin, deleteUser);

// Add /me endpoint
router.get("/me", protect, async (req, res) => {
  // req.user is set by protect middleware
  if (!req.user) return res.status(401).json({ message: "Not authorized" });
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    createdAt: req.user.createdAt,
    updatedAt: req.user.updatedAt,
  });
});

module.exports = router;
