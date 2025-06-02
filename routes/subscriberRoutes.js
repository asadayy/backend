const express = require("express");
const router = express.Router();
const {
  subscribe,
  getAllSubscribers,
  sendMailToSubscribers,
} = require("../controllers/subscriberController");
const { protect, admin } = require("../middleware/authMiddleware");
// const {
//   sendMailToSubscribers,
// } = require("../controllers/subscriberController");

router.post("/subscribers", subscribe);
router.get("/subscribers", getAllSubscribers);
router.post("/subscribers/send-mail", sendMailToSubscribers);

module.exports = router;
