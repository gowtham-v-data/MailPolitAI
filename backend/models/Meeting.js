const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: [true, 'Client ID is required']
  },
  emailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Email'
  },
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Meeting date is required']
  },
  time: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 60
  },
  location: {
    type: String,
    default: ''
  },
  participants: [{
    name: { type: String },
    email: { type: String }
  }],
  status: {
    type: String,
    enum: ['upcoming', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

meetingSchema.index({ clientId: 1 });
meetingSchema.index({ date: 1 });
meetingSchema.index({ status: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
