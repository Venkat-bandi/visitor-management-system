import User from "../models/User.js";
import PreApprovedAdmin from "../models/PreApprovedAdmin.js";
import PreApprovedSecurity from "../models/PreApprovedSecurity.js";
import jwt from "jsonwebtoken";

// -------------------------------
// HARDCODED SUPER ADMINS
// -------------------------------
const SUPER_ADMINS = [
  {
    email: "superadmin1@visitor.com",
    password: "superadmin123",
    name: "Super Admin 1",
    role: "super_admin",
    id: "super-admin-1",
  },
  {
    email: "superadmin2@visitor.com",
    password: "superadmin123",
    name: "Super Admin 2",
    role: "super_admin",
    id: "super-admin-2",
  },
  {
    email: "superadmin3@visitor.com",
    password: "superadmin123",
    name: "Super Admin 3",
    role: "super_admin",
    id: "super-admin-3",
  },
];

// ==========================================
// LOGIN CONTROLLER
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Email & password required" });

    const normalizedEmail = email.toLowerCase();

    // -----------------------------------------
    // SUPER ADMIN LOGIN
    // -----------------------------------------
    const superAdmin = SUPER_ADMINS.find(
      (a) => a.email === normalizedEmail && a.password === password
    );

    if (superAdmin) {
      const token = jwt.sign(
        {
          id: superAdmin.id,
          email: superAdmin.email,
          role: superAdmin.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      return res.json({
        success: true,
        token,
        user: {
          id: superAdmin.id,
          name: superAdmin.name,
          email: superAdmin.email,
          role: superAdmin.role,
        },
      });
    }

    // -----------------------------------------
    // NORMAL USER LOGIN (ADMIN / SECURITY / VISITOR)
    // -----------------------------------------
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);

    if (!isMatch)
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });

    const token = user.getSignedJwtToken();

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during login" });
  }
};

// ==========================================
// REGISTER CONTROLLER
// ==========================================
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = email.toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists)
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });

    // -----------------------------------------
    // ADMIN PRE-APPROVAL CHECK
    // -----------------------------------------
    if (role === "admin") {
      const pre = await PreApprovedAdmin.findOne({
        email: normalizedEmail,
        used: false,
      });

      if (!pre)
        return res.status(400).json({
          success: false,
          message:
            "This email is not pre-approved for admin. Contact Super Admin.",
        });

      pre.used = true;
      await pre.save();
    }

    // -----------------------------------------
    // SECURITY PRE-APPROVAL CHECK
    // -----------------------------------------
    if (role === "security") {
      const pre = await PreApprovedSecurity.findOne({
        email: normalizedEmail,
        used: false,
      });

      if (!pre)
        return res.status(400).json({
          success: false,
          message:
            "This email is not pre-approved for security. Contact Admin.",
        });

      pre.used = true;
      await pre.save();
    }

    // -----------------------------------------
    // CREATE USER
    // -----------------------------------------
    const newUser = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
    });

    const token = newUser.getSignedJwtToken();

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error during registration" });
  }
};

// ==========================================
// GET CURRENT LOGGED-IN USER
// ==========================================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("GetMe error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error fetching user" });
  }
};
