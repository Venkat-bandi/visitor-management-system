import jwt from "jsonwebtoken";
import User from "../models/User.js";
import PreApprovedAdmin from "../models/PreApprovedAdmin.js";
import PreApprovedSecurity from "../models/PreApprovedSecurity.js";

// ======================================
// PROTECT ROUTE (Verify Token)
// ======================================
export const protect = async (req, res, next) => {
  try {
    let token;

    // Token from headers
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("Token error:", err);
    res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

// ======================================
// ROLE BASED ACCESS
// ======================================
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    next();
  };
};

// ======================================
// ADMIN / SECURITY EMAIL VALIDATOR
// ======================================
export const validateRoleEmail = async (email, role) => {
  if (role === "admin") {
    const check = await PreApprovedAdmin.findOne({ email });
    return check ? true : false;
  }

  if (role === "security") {
    const check = await PreApprovedSecurity.findOne({ email });
    return check ? true : false;
  }

  return false;
};
