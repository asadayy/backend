const Subscriber = require("../models/Subscriber");
const asyncHandler = require("express-async-handler");
const nodemailer = require("nodemailer");

// @desc    Subscribe to newsletter
// @route   POST /api/subscribers
// @access  Public
const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const existing = await Subscriber.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error("Already subscribed");
  }

  const subscriber = await Subscriber.create({ email });
  res.status(201).json({ message: "Subscribed successfully" });
});

// @desc    Get all subscribers
// @route   GET /api/subscribers
// @access  Private/Admin
const getAllSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
  res.json(subscribers);
});

// @desc    Send mail to all subscribers
// @route   POST /api/subscribers/send-mail
// @access  Private/Admin
const sendMailToSubscribers = asyncHandler(async (req, res) => {
  const { subject, message } = req.body;

  if (!subject || !message) {
    res.status(400);
    throw new Error("Please provide both subject and message");
  }

  // Get all subscribers
  const subscribers = await Subscriber.find({});
  if (!subscribers || subscribers.length === 0) {
    res.status(404);
    throw new Error("No subscribers found");
  }

  // console.log(`Found ${subscribers.length} subscribers to send email to`);

  // Create transporter using Gmail
  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "asadebukhari04@gmail.com",
      pass: "ffrjztsebcezxgud",
    },
  });

  // Verify transporter configuration
  try {
    await transporter.verify();
    // console.log("SMTP connection verified successfully");
  } catch (error) {
    console.error("SMTP connection failed:", error);
    res.status(500);
    throw new Error("Failed to connect to email server");
  }

  // Send email to each subscriber
  const emailPromises = subscribers.map(async (subscriber) => {
    const mailOptions = {
      from: '"The Ordinary" <asadebukhari04@gmail.com>',
      to: subscriber.email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a5d44;">${subject}</h2>
          <div style="margin: 20px 0; line-height: 1.6;">
            ${message}
          </div>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            This email was sent to you because you subscribed to The Ordinary newsletter.
            <br>
            To unsubscribe, please contact our support team.
          </p>
        </div>
      `,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      // console.log(`Email sent to ${subscriber.email}:`, info.messageId);
      return {
        email: subscriber.email,
        status: "success",
        messageId: info.messageId,
      };
    } catch (error) {
      console.error(`Failed to send email to ${subscriber.email}:`, error);
      return {
        email: subscriber.email,
        status: "failed",
        error: error.message,
      };
    }
  });

  try {
    const results = await Promise.all(emailPromises);
    const successful = results.filter((r) => r.status === "success").length;
    const failed = results.filter((r) => r.status === "failed").length;

    // console.log(
    //   `Email sending completed. Successful: ${successful}, Failed: ${failed}`
    // );

    res.status(200).json({
      message: `Email sent successfully to ${successful} subscribers. Failed: ${failed}`,
      results,
    });
  } catch (error) {
    console.error("Failed to send emails:", error);
    res.status(500);
    throw new Error(`Failed to send emails: ${error.message}`);
  }
});

module.exports = {
  subscribe,
  getAllSubscribers,
  sendMailToSubscribers,
};
