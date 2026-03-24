require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // Adjust path to your User model

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB...');

    // Clear existing users to prevent duplicate errors
    await User.deleteMany();
    console.log('🧹 Cleared existing users...');

    // Hash passwords
    const salt = await bcrypt.genSalt(10);
    
    // UPDATED: Matching the frontend auto-fill passwords
    const adminPassword = await bcrypt.hash('admin123', salt);
    const userPassword = await bcrypt.hash('user123', salt);

    // Create Admin
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@spacehub.com',
      password: adminPassword,
      role: 'admin' // Ensure role is 'admin' for the redirect to work
    });

    // Create Regular User
    const regularUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: userPassword,
      role: 'user'
    });

    await adminUser.save();
    await regularUser.save();

    console.log('✨ Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('👑 Admin Email: admin@spacehub.com | Password: admin123');
    console.log('👤 User Email:  test@example.com   | Password: user123');
    console.log('--------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();