const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Function to analyze skin image using Gemini API
async function analyzeSkinWithGemini(imageBuffer, productData, mimeType) {
  try {
    // Use the dedicated skin analyzer API key
    const apiKey = process.env.SKIN_ANALYZER_API_KEY;
    if (!apiKey) {
      throw new Error("Skin analyzer API key not configured");
    }

    // Verify we have a valid image buffer
    if (!Buffer.isBuffer(imageBuffer)) {
      throw new Error("Invalid image data: Buffer expected");
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the updated model as the previous one was deprecated
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert buffer to base64
    const imageBase64 = imageBuffer.toString("base64");
    
    // Use provided mime type or default to jpeg
    if (!mimeType) {
      mimeType = "image/jpeg";
    }

    // Validate product data
    if (!Array.isArray(productData)) {
      console.error("Product data is not an array:", typeof productData);
      throw new Error("Invalid product data format");
    }

    // Prepare product information for the prompt
    let productInfo = [];
    try {
      productInfo = productData.map((product) => {
        if (!product || typeof product !== "object") {
          throw new Error("Invalid product entry");
        }
        return {
          id: product.id || "unknown",
          name: product.name || "Unknown Product",
          description: product.description || "",
          category: product.category || "Unknown Category",
          targets: Array.isArray(product.targets) ? product.targets : [],
          key_ingredients: Array.isArray(product.key_ingredients)
            ? product.key_ingredients
            : [],
        };
      });

      console.log(`Processed ${productInfo.length} products for analysis`);
    } catch (error) {
      console.error("Error processing product data:", error);
      throw new Error(`Failed to process product data: ${error.message}`);
    }

    // Create a well-structured prompt for the Gemini API
    const prompt = `
      You are a professional skin analyzer for "The Ordinary" skincare brand. Analyze this skin image and provide a detailed analysis in the following format:

      ## Skin Analysis
      - Skin Type: [Identify the skin type (dry, oily, combination, normal)]
      - Skin Concerns: [List main skin concerns visible in the image]
      - Skin Condition: [Provide a detailed assessment of the skin condition]
      - Skin Texture: [Describe the skin texture]
      - Skin Tone: [Describe the skin tone and any unevenness]
      - Visible Issues: [List any visible issues like acne, wrinkles, etc.]

      ## Product Recommendations
      Based on the identified skin concerns, recommend specific products from The Ordinary. For each recommended product:
      - Product Name: [Name from the product list]
      - Why It Helps: [Detailed explanation of how this product addresses the identified concerns]
      - Key Ingredients: [List key ingredients that target the specific concerns]
      - Expected Results: [What improvements to expect]
      - Usage Instructions: [How to use the product effectively]

      ## Usage Plan
      Provide a detailed morning and evening skincare routine using the recommended products:
      - Morning Routine: [Step by step routine with specific instructions]
      - Evening Routine: [Step by step routine with specific instructions]
      - Application Tips: [Specific advice on how to apply each product]
      - Usage Frequency: [How often to use each product]
      - Product Layering: [Correct order of product application]
      - Patch Testing: [Instructions for patch testing new products]

      ## Additional Recommendations
      - Dietary Suggestions: [Foods that may help the skin concerns]
      - Lifestyle Recommendations: [Activities or habits that could improve skin health]
      - Hygiene Tips: [Specific hygiene practices to improve skin condition]
      - Environmental Factors: [How to protect skin from environmental damage]
      - Sun Protection: [Specific sun protection recommendations]
      - Sleep Habits: [How sleep affects skin health]

      Ensure all recommendations are specific to the visible skin concerns in the image and use the product information I've provided. Be detailed and specific in your analysis and recommendations.
    `;

    // Generate content
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType } },
            { text: `Available products: ${JSON.stringify(productInfo)}` },
          ],
        },
      ],
    });

    console.log("Gemini API call completed successfully");

    return result.response.text();
  } catch (error) {
    console.error("Error analyzing skin with Gemini:", error);
    throw error;
  }
}

// Function to parse the Gemini response into structured data
function parseAnalysisResponse(response) {
  try {
    // Define sections to extract
    const sections = {
      analysis: /## Skin Analysis([\s\S]*?)(?=## Product Recommendations|$)/i,
      recommendations:
        /## Product Recommendations([\s\S]*?)(?=## Usage Plan|$)/i,
      usagePlan: /## Usage Plan([\s\S]*?)(?=## Additional Recommendations|$)/i,
      additionalRecommendations:
        /## Additional Recommendations([\s\S]*?)(?=$)/i,
    };

    // Extract each section
    const result = {};
    for (const [key, regex] of Object.entries(sections)) {
      const match = response.match(regex);
      result[key] = match ? match[1].trim() : "";
    }

    // Parse skin type and concerns from the analysis section
    if (result.analysis) {
      const skinTypeMatch = result.analysis.match(/Skin Type:(.+?)(?=\n|-|$)/);
      const skinConcernsMatch = result.analysis.match(
        /Skin Concerns:(.+?)(?=\n|-|$)/
      );

      result.skinType = skinTypeMatch
        ? skinTypeMatch[1].trim()
        : "Not identified";
      result.skinConcerns = skinConcernsMatch
        ? skinConcernsMatch[1]
            .trim()
            .split(",")
            .map((concern) => concern.trim())
        : [];
    }

    return result;
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return {
      analysis: response,
      recommendations: "",
      usagePlan: "",
      additionalRecommendations: "",
      skinType: "Not identified",
      skinConcerns: [],
    };
  }
}

module.exports = {
  analyzeSkinWithGemini,
  parseAnalysisResponse,
};
