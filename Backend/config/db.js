const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('123456', 10);
      await User.create({
        name: 'Demo Admin',
        phone: '9876543210',
        email: 'admin@udaan.com',
        password: hashedPassword,
        businessName: 'Udaan BillBook',
        role: 'admin',
        status: 'Active'
      });
      console.log('Admin user seeded successfully!');
    } else {
      let updated = false;
      if (adminExists.role !== 'admin') {
        adminExists.role = 'admin';
        updated = true;
      }
      if (adminExists.email !== 'admin@udaan.com') {
        adminExists.email = 'admin@udaan.com';
        updated = true;
      }
      if (!adminExists.subscription || adminExists.subscription.plan !== 'None') {
        adminExists.subscription = { plan: 'None', status: 'inactive' };
        updated = true;
      }
      
      // Enforce password seeding to '123456'
      const isPasswordCorrect = await bcrypt.compare('123456', adminExists.password);
      if (!isPasswordCorrect) {
        const hashedPassword = await bcrypt.hash('123456', 10);
        adminExists.password = hashedPassword;
        updated = true;
      }

      if (updated) {
        await adminExists.save();
        console.log('Admin user credentials aligned/updated.');
      }
    }
  } catch (error) {
    console.error(`Seeding admin failed: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      family: 4 // Force IPv4 to bypass common Windows/ISP DNS SRV issues
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    // Seed admin by default
    await seedAdmin();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
