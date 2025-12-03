import mongoose from 'mongoose';

const tokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '24h' } // Auto delete after 24 hours
  }
}, {
  timestamps: true
});

export default mongoose.model('Token', tokenSchema);