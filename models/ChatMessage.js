const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema({
    userMessage: String,
    botResponse: String,
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);