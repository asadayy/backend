// For now, simple echo or static reply. Later integrate OpenAI or your own logic.
const ChatMessage = require("../models/ChatMessage");

const chat = async (req, res) => {
    const { message } = req.body;
    const reply = `You said: ${message}`;
    // optional persistence:
    await ChatMessage.create({ userMessage: message, botResponse: reply });
    res.json({ reply });
};

module.exports = { chat };
