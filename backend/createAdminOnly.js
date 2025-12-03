import User from './models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createAdminOnly = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check if admin exists
    const adminExists = await User.findOne({email: 'admin@visitor.com'});
    if (adminExists) {
      console.log('❌ Admin already exists, deleting...');
      await User.deleteOne({email: 'admin@visitor.com'});
    }
    
    // Create admin
    const admin = new User({
      name: 'System Admin',
      email: 'admin@visitor.com',
      password: 'admin123',
      role: 'admin',
      phone: '9999999999'
    });
    
    await admin.save();
    console.log('✅ ADMIN CREATED: admin@visitor.com / admin123');
    
    // Verify
    const verify = await User.findOne({email: 'admin@visitor.com'});
    console.log('✅ VERIFIED: Admin exists in database:', !!verify);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

createAdminOnly();