import User from '../models/User.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const createDefaultAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        name: 'System Admin',
        email: 'admin@visitor.com',
        password: 'admin123',
        role: 'admin',
        phone: '9999999999'
      });
      
      await admin.save();
      console.log('✅ Default admin created: admin@visitor.com / admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
    }

    // Create default security user
    const securityExists = await User.findOne({ role: 'security' });
    
    if (!securityExists) {
      const security = new User({
        name: 'Security Guard',
        email: 'security@visitor.com',
        password: 'security123',
        role: 'security',
        phone: '8888888888'
      });
      
      await security.save();
      console.log('✅ Default security created: security@visitor.com / security123');
    } else {
      console.log('ℹ️ Security user already exists');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error creating users:', error);
  }
};

createDefaultAdmin();