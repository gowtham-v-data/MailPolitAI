const mongoose = require('mongoose');

const connectedAccountSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['gmail', 'outlook'],
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['connected', 'disconnected', 'syncing'],
    default: 'connected'
  },
  lastSync: {
    type: Date,
    default: Date.now
  },
  connectedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: 150
  },
  email: {
    type: String,
    required: [true, 'Client email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  company: {
    type: String,
    trim: true,
    default: ''
  },
  phone: {
    type: String,
    trim: true,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  assistantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assistant ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  connectedAccounts: [connectedAccountSchema],
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    aiClassification: {
      type: Boolean,
      default: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

clientSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

clientSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Client', clientSchema);
