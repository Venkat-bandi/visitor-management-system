import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    select: false,
    minlength: 6
  },
  role: { 
    type: String, 
    enum: ['admin', 'security', 'super_admin'],
    required: [true, 'Role is required']
  }
}, {
  timestamps: true
});

// Hash password
UserSchema.pre("save", async function (next) {
  try {
    if (!this.isModified("password")) return next();
    
    console.log('🔐 Hashing password for user:', this.email);
    this.password = await bcrypt.hash(this.password, 12);
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

// Match password
UserSchema.methods.matchPassword = async function (password) {
  try {
    console.log('🔑 Comparing passwords for user:', this.email);
    const isMatch = await bcrypt.compare(password, this.password);
    console.log('🔑 Password match result:', isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    throw new Error('Password comparison failed');
  }
};

// Get JWT token
UserSchema.methods.getSignedJwtToken = function () {
  try {
    console.log('🎫 Generating JWT token for user:', this.email);
    
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET is missing from environment variables');
      throw new Error('JWT secret not configured');
    }
    
    const token = jwt.sign(
      { 
        id: this._id, 
        email: this.email, 
        role: this.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: process.env.JWT_EXPIRE || '30d' 
      }
    );
    
    console.log('✅ JWT token generated successfully');
    return token;
  } catch (error) {
    console.error('❌ JWT token generation error:', error);
    throw new Error('Token generation failed: ' + error.message);
  }
};

export default mongoose.model("User", UserSchema);