const Rating = require('../models/Rating');
const Product = require('../models/Product');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Create or update a rating
// @route   POST /api/ratings
// @access  Public
exports.createOrUpdateRating = async (req, res) => {
  try {
    const { productId, rating, review, userName } = req.body;
    let userId = null;
    let displayName = userName || 'Anonymous';

    // Get user from token if available
    if (req.user && req.user.id) {
      userId = req.user.id;
      const user = await User.findById(userId);
      if (user) {
        displayName = user.name || user.email.split('@')[0] || displayName;
      }
    }

    // Basic validation
    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Create new rating
    const newRating = await Rating.create({
      productId,
      userId,
      userName: displayName,
      rating,
      review: review || ''
    });

    // Get updated average rating
    await Rating.getAverageRating(productId);

    res.status(201).json({
      success: true,
      data: newRating
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all ratings for a product
// @route   GET /api/ratings/product/:productId
// @access  Public
exports.getProductRatings = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get ratings
    const ratings = await Rating.find({ productId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Rating.countDocuments({ productId });

    res.status(200).json({
      success: true,
      count: ratings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: ratings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get all reviews for a product (only those with review text)
// @route   GET /api/ratings/reviews/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get reviews (ratings with review text)
    const reviews = await Rating.find({ 
      productId,
      review: { $exists: true, $ne: '' } 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Rating.countDocuments({ 
      productId,
      review: { $exists: true, $ne: '' } 
    });

    res.status(200).json({
      success: true,
      count: reviews.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: reviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get average rating for a product
// @route   GET /api/ratings/average/:productId
// @access  Public
exports.getAverageRating = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId)
      .select('averageRating ratingCount');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        averageRating: product.averageRating,
        ratingCount: product.ratingCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get featured reviews for homepage
// @route   GET /api/ratings/featured
// @access  Public
exports.getFeaturedReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    
    // First try to get reviews marked as featured
    let featuredReviews = await Rating.find({ 
      featured: true,
      review: { $exists: true, $ne: '' }
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('productId', 'name image_url');
    
    // If not enough featured reviews, get the most recent ones with text
    if (featuredReviews.length < limit) {
      const additionalReviews = await Rating.find({
        featured: { $ne: true },
        review: { $exists: true, $ne: '' }
      })
        .sort({ createdAt: -1 })
        .limit(limit - featuredReviews.length)
        .populate('productId', 'name image_url');
      
      featuredReviews = [...featuredReviews, ...additionalReviews];
    }
    
    res.status(200).json({
      success: true,
      count: featuredReviews.length,
      data: featuredReviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
