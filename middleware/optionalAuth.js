// backend/middleware/optionalAuth.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware that attempts to authenticate a user but allows the request to proceed
 * even if no valid token is provided. If authentication succeeds, req.user will be set.
 */
const optionalAuth = async (req, res, next) => {
    // Expect "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    
    // If no auth header, proceed as guest
    if (!authHeader?.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        // Verify token and extract the subject (userId)
        const { sub: userId, id } = jwt.verify(token, process.env.JWT_SECRET);
        // Support either "sub" or legacy "id" claim
        const uid = userId || id;
        
        if (uid) {
            // Fetch user and remove password
            const user = await User.findById(uid).select("-password");
            if (user) {
                // Attach to request
                req.user = user;
            }
        }
    } catch (error) {
        // If token verification fails, just continue as guest
        console.log("JWT verification failed:", error.message);
    }
    
    // Always continue to next middleware
    next();
};

module.exports = { optionalAuth };
