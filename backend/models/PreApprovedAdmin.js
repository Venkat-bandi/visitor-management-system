import mongoose from 'mongoose';

const preApprovedAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
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

// Use different collection name
export default mongoose.model('PreApprovedAdmin', preApprovedAdminSchema, 'pre_approved_admins');