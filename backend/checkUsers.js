// File: /backend/checkAllUsers.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkAllUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\n=== ALL USERS IN DATABASE ===');
    users.forEach(user => {
      console.log(`- ${user.email} (${user.role})`);
    });
    console.log('==============================\n');
    
    // Check specifically for our users
    const admin = await mongoose.connection.db.collection('users').findOne({email: 'admin@visitor.com'});
    const security = await mongoose.connection.db.collection('users').findOne({email: 'security@visitor.com'});
    
    console.log('admin@visitor.com exists:', !!admin);
    console.log('security@visitor.com exists:', !!security);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
};

checkAllUsers();