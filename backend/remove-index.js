import mongoose from 'mongoose';
import 'dotenv/config';

async function removeIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Remove the approvalToken unique index
    await mongoose.connection.collection('visitors').dropIndex('approvalToken_1');
    console.log('✅ approvalToken_1 unique index removed permanently');
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

removeIndex();