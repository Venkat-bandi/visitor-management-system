import mongoose from 'mongoose';

const preApprovedSecuritySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  addedByAdmin: {
    type: String,
    required: true
  },
  used: {
    type: Boolean,
    default: false
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('PreApprovedSecurity', preApprovedSecuritySchema, 'pre_approved_security');