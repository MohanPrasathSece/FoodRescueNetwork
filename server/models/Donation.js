const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  foodType: {
    type: String,
    enum: ['produce', 'prepared', 'packaged'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    required: true
  },
  pickupInstructions: String,
  status: {
    type: String,
    enum: ['available', 'claimed', 'completed', 'expired'],
    default: 'available'
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  pickupTime: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
donationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Donation = mongoose.model('Donation', donationSchema);

module.exports = Donation;