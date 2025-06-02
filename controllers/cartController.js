const Cart = require("../models/Cart");
const Product = require("../models/Product");

// Helper function to get cart identifier
const getCartIdentifier = (req) => {
  if (req.user) {
    return { userId: req.user._id };
  }
  // For guest users, use session ID
  return { guestId: req.sessionID };
};

exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const identifier = getCartIdentifier(req);

    // console.log('Adding/updating product:', productId, 'with quantity:', quantity);

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find or create cart
    let cart = await Cart.findOne(identifier);
    if (!cart) {
      cart = new Cart({ ...identifier });
    }

    // Add or update item in cart
    const cartItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (cartItem) {
      // REPLACE the quantity instead of adding to it
      cartItem.quantity = quantity;
      cartItem.price = product.price; // Ensure price is updated if it changes
      cartItem.name = product.name; // Add/update product name
    } else {
      cart.items.push({
        productId,
        quantity,
        price: product.price,
        name: product.name, // Add product name
      });
    }

    // Calculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.updatedAt = new Date();
    await cart.save();

    // Return updated cart with items populated with product details
    const populatedCart = await Cart.findOne(identifier).populate(
      "items.productId"
    );

    // Format the response to match the expected format in the frontend
    const items = populatedCart.items.map((item) => {
      return {
        productId: item.productId._id,
        name: item.productId.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.productId.image_url,
      };
    });

    res.json({
      items: items,
      total: populatedCart.total,
    });
  } catch (error) {
    console.error("Error adding/updating item in cart:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getCart = async (req, res) => {
  try {
    let items = [];
    let total = 0;
    let cart = null;
    if (req.user && req.user._id) {
      // Always fetch cart by authorized user's userId
      cart = await Cart.findOne({ userId: req.user._id }).populate(
        "items.productId"
      );
    } else if (req.sessionID) {
      // Guest fallback
      cart = await Cart.findOne({ guestId: req.sessionID }).populate(
        "items.productId"
      );
    }
    if (cart) {
      items = cart.items || [];
      total = cart.total || 0;
    }
    res.json({ items, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkout = async (req, res) => {
  try {
    const identifier = getCartIdentifier(req);
    const cart = await Cart.findOne(identifier);

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // For authenticated users, proceed with checkout
    if (req.user) {
      // Process payment (implement payment gateway integration here)
      // For now, we'll just mark the cart as processed
      cart.items = [];
      cart.total = 0;
      await cart.save();
      return res.json({ message: "Checkout successful" });
    }

    // For guest users, return cart details for checkout
    res.json({
      items: cart.items,
      total: cart.total,
      message: "Please login to complete checkout",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.mergeCarts = async (req, res) => {
  try {
    // Get both carts - guest and authenticated user's cart
    const guestCart = await Cart.findOne({ guestId: req.sessionID });
    const userCart = await Cart.findOne({ userId: req.user._id });

    if (!guestCart) {
      return res.json({ message: "No guest cart to merge" });
    }

    // If user has existing cart, merge items
    if (userCart) {
      // Merge items from guest cart to user cart
      guestCart.items.forEach((guestItem) => {
        const existingItem = userCart.items.find(
          (item) => item.productId.toString() === guestItem.productId.toString()
        );

        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          userCart.items.push(guestItem);
        }
      });

      // Update total
      userCart.total = userCart.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      await userCart.save();

      // Delete guest cart
      await guestCart.deleteOne();
    } else {
      // If user has no existing cart, convert guest cart to user cart
      guestCart.userId = req.user._id;
      guestCart.guestId = undefined;
      await guestCart.save();
    }

    res.json({ message: "Carts merged successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params; // Get product ID from URL parameter
    const identifier = getCartIdentifier(req);

    // console.log('Removing product:', productId, 'from cart with identifier:', identifier);

    // Find cart
    const cart = await Cart.findOne(identifier);

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the item index in the cart
    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    // Remove the item from the cart
    cart.items.splice(itemIndex, 1);

    // Recalculate total
    cart.total = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    cart.updatedAt = new Date();

    await cart.save();

    // Return updated cart with items populated with product details
    const populatedCart = await Cart.findOne(identifier).populate(
      "items.productId"
    );

    // Format the response to match the expected format in the frontend
    const items = populatedCart.items.map((item) => {
      return {
        productId: item.productId._id,
        name: item.productId.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.productId.image_url,
      };
    });

    res.json({
      items: items,
      total: populatedCart.total,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ message: error.message });
  }
};
