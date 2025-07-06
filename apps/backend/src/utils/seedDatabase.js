const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Template = require('../models/Template');
const sampleTemplate = require('./sampleTemplate');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing data (optional - comment out in production)
    // await User.deleteMany({});
    // await Template.deleteMany({});
    // console.log('Cleared existing data');

    // Create admin user
    const adminExists = await User.findOne({ email: 'sanchit.sah@lumberfi.com' });
    if (!adminExists) {
      const adminUser = new User({
        email: 'sanchit.sah@lumberfi.com',
        password: 'password123',
        firstName: 'Sanchit',
        lastName: 'Sah',
        role: 'admin',
        companyName: 'System Admin'
      });
      await adminUser.save();
      console.log('Created admin user');

      // Create sample template
      const templateExists = await Template.findOne({ name: sampleTemplate.name });
      if (!templateExists) {
        const template = new Template({
          ...sampleTemplate,
          createdBy: adminUser._id
        });
        await template.save();
        console.log('Created sample template');
      }
    } else {
      console.log('Admin user already exists');
    }

    // Create sample regular user
    const userExists = await User.findOne({ email: 'user@example.com' });
    if (!userExists) {
      const regularUser = new User({
        email: 'user@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
        companyName: 'ABC Construction'
      });
      await regularUser.save();
      console.log('Created sample user');
    } else {
      console.log('Sample user already exists');
    }

    console.log('Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Admin: admin@example.com / password123');
    console.log('User: user@example.com / password123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seeding function if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase; 