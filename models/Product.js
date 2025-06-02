const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ["Skincare", "Hair & Body", "Sets & Collections"],
      required: true,
    },
    price: { type: Number, required: true },
    image_url: { type: String, required: true },
    stock: { type: Number, default: 0 }, // optional if you track stock
    stockStatus: {
      type: String,
      enum: ["In Stock", "Out of Stock"],
      default: "In Stock",
    },
    targets: { type: [String], default: [] },
    suitedTo: {
      type: String,
      enum: ["All Skin Types", "Normal", "Dry", "Oily", "Combination"],
      required: true,
    },
    keyIngredients: { type: [String], default: [] },
    format: { type: String },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    ratingCount: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", ProductSchema);
