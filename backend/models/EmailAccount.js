const mongoose = require('mongoose');

const emailAccountSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  provider: {
    type: String,
    enum: ['gmail', 'outlook', 'custom'],
    required: [true, 'Provider is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'syncing', 'error'],
    default: 'connected'
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  totalEmails: {
    type: Number,
    default: 0
  },
  unreadEmails: {
    type: Number,
    default: 0
  },
  syncFrequency: {
    type: Number,
    default: 15
  },
  accessToken: {
    type: String,
    default: ''
  },
  refreshToken: {
    type: String,
    default: ''
  },
  connectedAt: {
    type: Date,
    default: Date.now
  }
});

emailAccountSchema.index({ clientId: 1 });

module.exports = mongoose.model('EmailAccount', emailAccountSchema);
