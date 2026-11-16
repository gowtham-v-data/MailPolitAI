const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  name: { type: String },
  size: { type: Number },
  type: { type: String }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  id: { type: String },
  from: {
    name: { type: String },
    email: { type: String }
  },
  to: [{
    name: { type: String },
    email: { type: String }
  }],
  cc: [{
    name: { type: String },
    email: { type: String }
  }],
  content: {
    type: String,
    required: true
  },
  html: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    required: true
  },
  attachments: [attachmentSchema]
}, { _id: false });

const deadlineSchema = new mongoose.Schema({
  description: { type: String },
  date: { type: Date }
}, { _id: false });

const meetingInfoSchema = new mongoose.Schema({
  title: { type: String },
  date: { type: Date },
  time: { type: String },
  location: { type: String },
  participants: [{ type: String }]
}, { _id: false });

const classificationHistorySchema = new mongoose.Schema({
  type: { type: String },
  confidence: { type: Number },
  reason: { type: String },
  changedBy: {
    type: String,
    enum: ['ai', 'manual', 'client']
  },
  changedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const emailSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  accountId: {
    type: String,
    default: ''
  },
  threadId: {
    type: String,
    required: [true, 'Thread ID is required'],
    unique: true
  },
  sender: {
    name: { type: String },
    email: { type: String },
    avatar: { type: String, default: '' }
  },
  recipients: [{
    name: { type: String },
    email: { type: String },
    type: {
      type: String,
      enum: ['to', 'cc', 'bcc'],
      default: 'to'
    }
  }],
  subject: {
    type: String,
    required: [true, 'Subject is required']
  },
  preview: {
    type: String,
    default: ''
  },
  messages: [messageSchema],
  classification: {
    type: {
      type: String,
      enum: ['ASSISTANT_TO_REPLY', 'CLIENT_TO_REPLY', 'NO_REPLY_NEEDED', 'NEEDS_REVIEW'],
      default: 'NEEDS_REVIEW'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    reason: { type: String, default: '' },
    summary: { type: String, default: '' },
    actionRequired: { type: Boolean, default: false },
    suggestedAction: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    classifiedAt: { type: Date },
    classifiedBy: {
      type: String,
      enum: ['ai', 'manual'],
      default: 'ai'
    }
  },
  classificationHistory: [classificationHistorySchema],
  extractedInfo: {
    actionItems: [{ type: String }],
    deadlines: [deadlineSchema],
    meetingInfo: meetingInfoSchema
  },
  isImportant: { type: Boolean, default: false },
  isUnread: { type: Boolean, default: true },
  isArchived: { type: Boolean, default: false },
  isStarred: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived', 'delegated'],
    default: 'active'
  },
  manualOverride: { type: Boolean, default: false },
  category: {
    type: String,
    enum: ['general', 'meeting', 'followup', 'urgent', 'administrative'],
    default: 'general'
  },
  labels: [{ type: String }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

emailSchema.index({ clientId: 1 });
emailSchema.index({ 'classification.type': 1 });
emailSchema.index({ isUnread: 1 });
emailSchema.index({ isArchived: 1 });
emailSchema.index({ status: 1 });
emailSchema.index({ createdAt: -1 });
emailSchema.index({ clientId: 1, 'classification.type': 1, isArchived: 1, status: 1 });

emailSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.messages && this.messages.length > 0) {
    const latestMessage = this.messages[this.messages.length - 1];
    this.preview = latestMessage.content.substring(0, 150);
  }
  next();
});

emailSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Email', emailSchema);
