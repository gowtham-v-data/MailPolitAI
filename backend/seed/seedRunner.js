/**
 * Seed Runner — reusable seed function that works with an existing DB connection.
 * Called by server.js auto-seed and also importable from the CLI seed script.
 */
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Client = require('../models/Client');
const Email = require('../models/Email');
const EmailAccount = require('../models/EmailAccount');
const Meeting = require('../models/Meeting');
const ActivityLog = require('../models/ActivityLog');
const { classifyEmail } = require('../services/aiClassifier');

function daysAgo(d) { return new Date(Date.now() - d * 24 * 60 * 60 * 1000); }
function hoursAgo(h) { return new Date(Date.now() - h * 60 * 60 * 1000); }

module.exports = async function seedRunner() {
  console.log('🌱 Initializing clean database (Real Data Only Mode)...');
  await Promise.all([
    User.deleteMany({}), Client.deleteMany({}), Email.deleteMany({}),
    EmailAccount.deleteMany({}), Meeting.deleteMany({}), ActivityLog.deleteMany({})
  ]);

  // ─── Users ───
  console.log('👤 Creating verified users...');
  const gowthamUser = await User.create({
    name: 'Gowtham Krishna',
    email: 'gowthamkrishna3107@gmail.com',
    password: 'password123',
    role: 'assistant'
  });
  const assistant = await User.create({
    name: 'Sarah Mitchell',
    email: 'sarah@mailpilot.ai',
    password: 'password123',
    role: 'assistant'
  });
  const clientUser = await User.create({
    name: 'James Richardson',
    email: 'james@techvision.com',
    password: 'password123',
    role: 'client'
  });

  // ─── Clients ───
  console.log('🏢 Creating primary client workspace...');
  const gowthamClient = await Client.create({
    name: 'Gowtham Krishna',
    email: 'gowthamkrishna3107@gmail.com',
    company: 'Google Workspace',
    phone: '',
    assistantId: assistant._id,
    status: 'active',
    connectedAccounts: [{
      provider: 'gmail',
      email: 'gowthamkrishna3107@gmail.com',
      status: 'connected',
      lastSync: new Date(),
      connectedAt: new Date()
    }]
  });

  // ─── Email Accounts ───
  console.log('📧 Registering real Gmail account...');
  await EmailAccount.create({
    clientId: gowthamClient._id,
    provider: 'gmail',
    email: 'gowthamkrishna3107@gmail.com',
    displayName: 'Gowtham Krishna',
    status: 'connected',
    lastSync: new Date(),
    totalEmails: 0,
    unreadEmails: 0,
    connectedAt: new Date()
  });

  await ActivityLog.create({
    clientId: gowthamClient._id,
    action: 'account_connected',
    description: 'System initialized in Real Data Only Mode for gowthamkrishna3107@gmail.com.',
    entityType: 'account'
  });

  console.log('\n🎉 Clean setup complete: 0 dummy emails, 100% ready for real Gmail sync!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Available accounts:');
  console.log('  gowthamkrishna3107@gmail.com / password123');
  console.log('  sarah@mailpilot.ai / password123');
  console.log('  james@techvision.com / password123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
};
