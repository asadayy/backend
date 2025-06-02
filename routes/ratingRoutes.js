const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Create or update a rating
router.post('/', ratingController.createOrUpdateRating);

// Get all ratings for a product
router.get('/product/:productId', ratingController.getProductRatings);

// Get reviews for a product (only those with review text)
router.get('/reviews/:productId', ratingController.getProductReviews);

// Get average rating for a product
router.get('/average/:productId', ratingController.getAverageRating);

// Get featured reviews for homepage
router.get('/featured', ratingController.getFeaturedReviews);

module.exports = router;
