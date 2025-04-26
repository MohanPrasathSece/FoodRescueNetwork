const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['donation_request', 'donation_accepted', 'pickup_scheduled', 'pickup_completed', 'donation_expired', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  relatedDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  },
  relatedPickup: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pickup'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Static method to get unread notifications for a user
notificationSchema.statics.getUnreadForUser = function(userId) {
  return this.find({
    recipient: userId,
    read: false
  }).sort({ createdAt: -1 });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
