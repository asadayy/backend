// backend/routes/cartRoutes.js

const express = require("express");
const router = express.Router();
const {
  addToCart,
  getCart,
  checkout,
  mergeCarts,
  removeFromCart,
} = require("../controllers/cartController");
const { protect } = require("../middleware/authMiddleware");
const { optionalAuth } = require("../middleware/optionalAuth");
const Cart = require("../models/Cart");

// Routes for both guest and authenticated users
// For authenticated users, user info comes from JWT
// For guests, sessionID should be passed in headers

router.post("/add", optionalAuth, addToCart); // Add to cart (guest or authenticated)
router.get("/", optionalAuth, getCart); // Fetch cart (guest or authenticated)
router.delete("/remove/:productId", optionalAuth, removeFromCart); // Remove item from cart

// Authenticated-only routes
router.post("/checkout", protect, checkout);
router.post("/merge", protect, mergeCarts);

// Clear cart
router.delete("/clear", protect, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.total = 0;
      await cart.save();
    }
    res.json({ items: [], total: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
