// backend/server.js
require("./setup");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const subscriberRoutes = require("./routes/subscriberRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const chatRoutes = require("./routes/chatRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const skinAnalyzerRoutes = require("./routes/skinAnalyzerRoutes");
const { errorHandler } = require("./middleware/errorMiddleware");
const mongoose = require("mongoose");
const fs = require("fs");

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow React devserver (http://localhost:3000) to send cookies
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ───── Session Middleware ──────────────────────────────────────────
// Use session middleware conditionally based on environment
if (process.env.NODE_ENV === 'production') {
  // In production, we'll use cookies without server-side session storage
  // This avoids the MemoryStore warning in production
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "replace_this_with_env_var",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: true, // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );
} else {
  // In development, use the default MemoryStore (this is fine for development)
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "replace_this_with_env_var",
      resave: false,
      saveUninitialized: true,
      cookie: { secure: false }
    })
  );
}

// ───── Route Mounting ──────────────────────────────────────────────
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", subscriberRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/skin-analyzer", skinAnalyzerRoutes);

// ───── Static File Server (images, etc.) ──────────────────────────
// Moved after API routes to prevent serving index.html for unmatched API routes
app.use(
  "/static",
  express.static(path.join(__dirname, "..", "frontend", "public"))
);

// If you have a catch-all route for your frontend application (e.g., for React Router),
// it should typically come after all API routes and static file serving.
// Example (uncomment and adjust if you have a frontend build and catch-all):
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
// });

// ───── Error Handler ──────────────────────────────────────────────
app.use(errorHandler);

// Create required directories - only in development environment
// Skip directory creation in production (Vercel) environment
if (process.env.NODE_ENV !== 'production') {
  const directories = [
    "uploads", // Temporary directory for multer uploads
    path.join("..", "frontend", "public", "Ordinary", "Products", "Skincare"),
    path.join("..", "frontend", "public", "Ordinary", "Products", "Hair & Body"),
    path.join(
      "..",
      "frontend",
      "public",
      "Ordinary",
      "Products",
      "Sets & Collections"
    ),
  ];

  directories.forEach((dir) => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  });
}

// Ensure uploads directory exists in all environments
try {
  if (!fs.existsSync(path.join(__dirname, "uploads"))) {
    fs.mkdirSync(path.join(__dirname, "uploads"), { recursive: true });
    console.log(`Created uploads directory`);
  }
} catch (err) {
  console.log("Note: Could not create uploads directory. This is expected in some environments.");
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ───── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
