const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require("dotenv");
const winston = require("winston");

dotenv.config();

// Set up logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Access your API key as a environment variable
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  // logger.error("GEMINI_API_KEY not found in .env file.");
  console.error("GEMINI_API_KEY not found in .env file.");
  // Exit or throw an error if the key is missing
  // For now, we'll just log and handle requests gracefully later
}

// Initialize the Generative AI model
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Controller function to handle chat messages
exports.sendChatMessage = async (req, res) => {
  const userMessage = req.body.message;

  if (!userMessage) {
    // logger.warn("Received empty message from user.");
    return res
      .status(400)
      .json({ message: "Message content cannot be empty." });
  }

  // logger.info(`Received message: ${userMessage}`);

  try {
    // Start a new chat session with the model
    // Provide a history to guide the model's persona and responses
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: "From now on, act as Skinthia, an AI skincare expert for The Ordinary website. Only answer questions directly related to skincare products available on The Ordinary website, general skincare advice relevant to these products, and information about the website's features (like categories, checkout process). Handle greetings politely. If a user asks about something completely unrelated to skincare or the website, politely inform them that you can only answer questions about skincare products on The Ordinary and the website itself, and redirect them to ask a relevant question.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Understood. I will act as Skinthia and focus on questions about The Ordinary skincare products, related advice, and website features. How can I assist you today?",
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 500, // Limit response length to keep it concise for a chatbot dropdown
      },
      safetySettings: [
        // Configure safety settings if needed
        // { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: SafetySettingThreshold.BLOCK_NONE, },
        // { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: SafetySettingThreshold.BLOCK_NONE, },
        // { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: SafetySettingThreshold.BLOCK_NONE, },
        // { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: SafetySettingThreshold.BLOCK_NONE, },
      ],
      // Removed systemInstruction as it caused a Bad Request error
      // systemInstruction: "Your previous system instruction text here",
    });

    const result = await chat.sendMessage(userMessage);
    const responseText = result.response.text();

    // logger.info(`Sent response: ${responseText}`);
    res.json({ response: responseText });
  } catch (error) {
    // logger.error(`Error sending message to Gemini API: ${error.message}`, { stack: error.stack });
    console.error(
      `Error sending message to Gemini API: ${error.message}`,
      error
    );
    res.status(500).json({ message: "Error interacting with the chatbot." });
  }
};
