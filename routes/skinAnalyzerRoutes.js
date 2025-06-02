const express = require('express');
const router = express.Router();
const { analyzeSkin } = require('../controllers/skinAnalyzerController');
const { protect } = require('../middleware/authMiddleware');
const { optionalAuth } = require('../middleware/optionalAuth');
const upload = require('../middleware/uploadMiddleware');

// POST /api/skin-analyzer/analyze
// Analyze skin image and provide recommendations
// Public route, but will use user data if authenticated
router.post('/analyze', optionalAuth, upload.single('skinImage'), analyzeSkin);

module.exports = router;
