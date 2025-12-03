import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  // Visitor Details
  visitorName: { type: String, required: true },
  visitorPhone: { type: String, required: true },
  visitorAddress: { type: String, required: true },
  visitorEmail: { type: String },
  
  // Owner Details
  ownerName: { type: String, required: true },
  ownerEmail: { type: String, required: true },
  ownerMobile: { type: String, required: true },
  
  // Property Details
  flatNo: { type: String, required: true },
  floor: { type: String, required: true },
  
  // Vehicle Details
  bikeNumber: { type: String },
  bikeNumberImage: { type: String },
  
  // Visitor Image
  visitorImage: { type: String, required: true },
  
  // Security who captured
  capturedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Approval System
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  // REMOVED: approvalToken field - it's in separate Token model
  approvedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  
  // Security email for notifications
  securityEmail: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model('Visitor', visitorSchema);