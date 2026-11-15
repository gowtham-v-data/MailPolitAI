const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: [true, 'Action is required']
  },
  description: {
    type: String,
    default: ''
  },
  entityType: {
    type: String,
    enum: ['email', 'client', 'meeting', 'classification', 'account']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

activityLogSchema.index({ clientId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
