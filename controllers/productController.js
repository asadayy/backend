const Product = require("../models/Product");
const asyncHandler = require("express-async-handler");
const Subscriber = require("../models/Subscriber");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs").promises;

// Helper function to create directory if it doesn't exist
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
};

// Helper function to sanitize filename
const sanitizeFileName = (fileName) => {
  return fileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
};

// GET /api/products
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i");
      filter.$or = [{ name: searchRegex }, { category: searchRegex }];
    }

    const [products, total] = await Promise.all([
      Product.find(filter).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not Found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/products
const createProduct = asyncHandler(async (req, res) => {
  try {
    const {
      name,
      category,
      price,
      description,
      targets,
      suitedTo,
      keyIngredients,
    } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    // Create directory path for the category in frontend
    const categoryDir = path.join(
      __dirname,
      "..",
      "..",
      "frontend",
      "public",
      "Ordinary",
      "Products",
      category
    );
    await ensureDirectoryExists(categoryDir);

    // Use original filename
    const fileName = req.file.originalname;
    const filePath = path.join(categoryDir, fileName);

    // Move the uploaded file to the correct location
    await fs.rename(req.file.path, filePath);

    // Create image URL relative to frontend public directory
    const image_url = path
      .join("Ordinary", "Products", category, fileName)
      .replace(/\\/g, "/");

    // Create new product
    const product = new Product({
      name,
      category,
      price,
      description,
      targets: targets.split(",").map((target) => target.trim()),
      suitedTo,
      keyIngredients: keyIngredients
        .split(",")
        .map((ingredient) => ingredient.trim()),
      image_url,
    });

    await product.save();

    // Send email notification to all subscribers
    try {
      const subscribers = await Subscriber.find({});
      if (subscribers && subscribers.length > 0) {
        let transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        const mailOptions = {
          from: `"The Ordinary" <${process.env.EMAIL_USER}>`,
          to: subscribers.map((sub) => sub.email).join(","),
          subject: `New Product Alert: ${product.name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a5d44;">New Product Alert!</h2>
              <div style="margin: 20px 0; line-height: 1.6;">
                <h3 style="color: #2c3e50;">${product.name}</h3>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Price:</strong> $${product.price}</p>
                <p><strong>Description:</strong> ${product.description}</p>
                <p><strong>Targets:</strong> ${product.targets.join(", ")}</p>
                <p><strong>Suited To:</strong> ${product.suitedTo}</p>
                <p><strong>Key Ingredients:</strong> ${product.keyIngredients.join(
                  ", "
                )}</p>
                <div style="margin: 20px 0;">
                  <a href="https://frontend-iota-orcin-43.vercel.app/products/${
                    product.category
                  }/${product.name
            .toLowerCase()
            .replace(
              /\s+/g,
              "-"
            )}" style="background-color: #1a5d44; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                    View Product
                  </a>
                </div>
              </div>
              <hr style="border: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                This email was sent to you because you subscribed to The Ordinary newsletter.
                <br>
                To unsubscribe, please contact our support team.
              </p>
            </div>
          `,
        };

        await transporter.sendMail(mailOptions);
      }
    } catch (error) {
      console.error("Failed to send product notification emails:", error);
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not Found" });

    // Handle image upload if new image is provided
    if (req.file) {
      // Delete old image
      try {
        const oldImagePath = path.join(
          __dirname,
          "..",
          "..",
          "frontend",
          "public",
          product.image_url
        );
        await fs.unlink(oldImagePath);
      } catch (error) {
        console.error("Error deleting old image:", error);
      }

      // Create directory path for the category in frontend
      const categoryDir = path.join(
        __dirname,
        "..",
        "..",
        "frontend",
        "public",
        "Ordinary",
        "Products",
        req.body.category || product.category
      );
      await ensureDirectoryExists(categoryDir);

      // Use original filename
      const fileName = req.file.originalname;
      const filePath = path.join(categoryDir, fileName);

      // Move the uploaded file to the correct location
      await fs.rename(req.file.path, filePath);

      // Update image URL relative to frontend public directory
      req.body.image_url = path
        .join(
          "Ordinary",
          "Products",
          req.body.category || product.category,
          fileName
        )
        .replace(/\\/g, "/");
    }

    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    console.log("Delete request received for ID:", req.params.id);
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    // Additional validation for ID
    if (!req.params.id || req.params.id === "undefined") {
      console.log("Invalid ID provided:", req.params.id);
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
        receivedId: req.params.id,
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      console.log("Product not found for ID:", req.params.id);
      return res.status(404).json({
        success: false,
        message: "Product not found",
        receivedId: req.params.id,
      });
    }

    console.log("Found product:", product._id);

    // Delete product image
    try {
      // Construct the full path to the image file
      const imagePath = path.join(
        __dirname,
        "..",
        "..",
        "frontend",
        "public",
        product.image_url
      );

      console.log("Attempting to delete image at:", imagePath);

      // Check if file exists before trying to delete
      try {
        await fs.access(imagePath);
        await fs.unlink(imagePath);
        console.log(`Successfully deleted image: ${imagePath}`);
      } catch (error) {
        if (error.code === "ENOENT") {
          console.log(`Image file not found: ${imagePath}`);
        } else {
          console.error(`Error accessing/deleting image: ${error.message}`);
        }
      }
    } catch (error) {
      console.error("Error handling product image deletion:", error);
    }

    // Delete the product from database
    await product.deleteOne();
    console.log(`Successfully deleted product: ${product._id}`);

    res.json({
      success: true,
      message: "Product deleted successfully",
      deletedProduct: {
        id: product._id,
        name: product.name,
        category: product.category,
      },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting product",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      receivedId: req.params.id,
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
