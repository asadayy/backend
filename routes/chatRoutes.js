const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/chatController");
const { sendChatMessage } = require("../controllers/chatbotController");

router.post("/", chat);

// POST route to send a message to the chatbot
router.post("/message", sendChatMessage);

module.exports = router;
