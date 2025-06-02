const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect, admin } = require("../middleware/authMiddleware");

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Temporary storage before moving to final location
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPG, JPEG, and PNG files are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Routes
router
  .route("/")
  .get(getAllProducts)
  .post(protect, admin, upload.single("image"), createProduct);

// Middleware to check if ID is provided
const checkProductId = (req, res, next) => {
  // console.log("Checking product ID:", req.params.id);
  if (!req.params.id || req.params.id === "undefined") {
    console.log("Invalid product ID detected");
    return res.status(400).json({
      success: false,
      message: "Product ID is required",
      receivedId: req.params.id,
    });
  }
  next();
};

// Delete route with explicit path
router.delete("/:id", checkProductId, protect, admin, deleteProduct);

// Other routes
router
  .route("/:id")
  .get(checkProductId, getProductById)
  .put(checkProductId, protect, admin, upload.single("image"), updateProduct);

// Error handling middleware for multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size too large. Maximum size is 5MB.",
      });
    }
    return res.status(400).json({
      message: error.message,
    });
  }
  next(error);
});

module.exports = router;
