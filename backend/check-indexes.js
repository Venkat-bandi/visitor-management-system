import mongoose from 'mongoose';
import 'dotenv/config';

async function checkIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const indexes = await mongoose.connection.collection('visitors').getIndexes();
    console.log('📊 Current indexes on visitors collection:');
    console.log(JSON.stringify(indexes, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.log('❌ Error:', error.message);
    process.exit(1);
  }
}

checkIndexes();