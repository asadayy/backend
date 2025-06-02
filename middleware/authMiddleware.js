// backend/middleware/authMiddleware.js

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  // Expect "Authorization: Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authorized: no token" });
  }

  const token = authHeader.split(" ")[1];
  try {
    // Verify token and extract the subject (userId)
    const { sub: userId, id } = jwt.verify(token, process.env.JWT_SECRET);
    // Support either "sub" or legacy "id" claim
    const uid = userId || id;
    if (!uid) {
      return res
        .status(401)
        .json({ message: "Not authorized: invalid token payload" });
    }

    // Fetch user and remove password
    const user = await User.findById(uid).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ message: "Not authorized: user not found" });
    }

    // Attach to request and continue
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      // Check for refresh token in cookies
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res
          .status(401)
          .json({ message: "Not authorized: token expired" });
      }

      try {
        // Verify refresh token
        const { sub: userId } = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );

        // Generate new access token
        const newAccessToken = jwt.sign(
          { sub: userId },
          process.env.JWT_SECRET,
          { expiresIn: "1h" }
        );

        // Set new access token in response header
        res.setHeader("New-Access-Token", newAccessToken);

        // Continue with the request
        const user = await User.findById(userId).select("-password");
        if (!user) {
          return res
            .status(401)
            .json({ message: "Not authorized: user not found" });
        }
        req.user = user;
        next();
      } catch (refreshErr) {
        return res
          .status(401)
          .json({ message: "Not authorized: refresh token failed" });
      }
    } else {
      console.error("JWT verification failed:", err);
      return res.status(401).json({ message: "Not authorized: token failed" });
    }
  }
};

const admin = (req, res, next) => {
  if (req.user?.isAdmin) {
    return next();
  }
  return res.status(403).json({ message: "Forbidden: admin only" });
};

module.exports = { protect, admin };
