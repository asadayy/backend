const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const { analyzeSkinWithGemini, parseAnalysisResponse } = require('../services/geminiService');

// Get product data
const getProductData = () => {
  try {
    const productPath = path.join(__dirname, '..', '..', 'frontend', 'products.json');
    const rawData = fs.readFileSync(productPath);
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading product data:', error);
    return [];
  }
};

// Analyze skin image and provide recommendations
const analyzeSkin = asyncHandler(async (req, res) => {
  // Check if image was uploaded
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image');
  }

  try {
    // Get product data
    const products = getProductData();
    
    if (!products || products.length === 0) {
      console.error('No product data available');
      return res.status(500).json({ message: 'No product data available for analysis' });
    }
    
    // Process image with Gemini API using the buffer in memory
    // instead of a file path
    console.log('Processing image from memory buffer');
    
    try {
      // Get the file buffer and mimetype from multer's memory storage
      const imageBuffer = req.file.buffer;
      const mimeType = req.file.mimetype;
      
      // Call the updated Gemini service with the buffer instead of a path
      const analysisResult = await analyzeSkinWithGemini(imageBuffer, products, mimeType);
      
      // Parse the Gemini response
      const parsedResult = parseAnalysisResponse(analysisResult);
      
      res.status(200).json({
        success: true,
        rawAnalysis: analysisResult, // For debugging, can be removed in production
        analysis: {
          skinType: parsedResult.skinType,
          skinConcerns: parsedResult.skinConcerns,
          fullAnalysis: parsedResult.analysis
        },
        recommendations: parsedResult.recommendations,
        usagePlan: parsedResult.usagePlan,
        additionalRecommendations: parsedResult.additionalRecommendations
      });
    } catch (apiError) {
      console.error('Error in Gemini API call:', apiError);
      res.status(500).json({
        message: 'Error analyzing image with AI service',
        error: apiError.message
      });
    }
  } catch (error) {
    // No need to clean up files since we're using memory storage
    res.status(500);
    throw new Error(`Error analyzing skin image: ${error.message}`);
  }
});

module.exports = {
  analyzeSkin
};
