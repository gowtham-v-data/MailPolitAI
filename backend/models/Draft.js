const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email',
    required: [true, 'Email ID is required']
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  content: {
    type: String,
    required: [true, 'Draft content is required']
  },
  tone: {
    type: String,
    enum: ['professional', 'friendly', 'formal', 'concise'],
    default: 'professional'
  },
  generatedBy: {
    type: String,
    enum: ['ai', 'manual'],
    default: 'ai'
  },
  status: {
    type: String,
    enum: ['draft', 'approved', 'sent', 'discarded'],
    default: 'draft'
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

draftSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

draftSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

draftSchema.index({ emailId: 1 });
draftSchema.index({ clientId: 1 });

module.exports = mongoose.model('Draft', draftSchema);
