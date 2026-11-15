require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000'], credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/emails', require('./routes/emails'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/accounts', require('./routes/accounts'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

connectDB().then(async (conn) => {
  // Auto-seed if using in-memory DB (empty database)
  const mongoose = require('mongoose');
  const User = require('./models/User');
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('\n📦 Empty database detected — auto-seeding demo data...');
    try {
      await require('./seed/seedRunner')();
      console.log('✅ Auto-seed complete!\n');
    } catch (seedErr) {
      console.error('⚠️  Auto-seed failed:', seedErr.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`\n✈️  MailPilot AI Backend running on port ${PORT}\n`);
  });
}).catch((err) => {
  console.error('Failed to connect to database:', err.message);
  process.exit(1);
});

module.exports = app;
