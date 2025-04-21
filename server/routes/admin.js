const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const { auth, authorize } = require('../middleware/auth');

// Middleware to ensure admin access
router.use(auth, authorize('admin'));

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Update user status
router.patch('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    user.status = status;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating user', error: error.message });
  }
});

// Get all donations
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Get all pickups
router.get('/pickups', async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate({
        path: 'donation',
        populate: { path: 'donor', select: 'name email' }
      })
      .populate('volunteer', 'name email')
      .sort({ createdAt: -1 });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pickups', error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [userCount, donationCount, pickupCount] = await Promise.all([
      User.countDocuments(),
      Donation.countDocuments(),
      Pickup.countDocuments()
    ]);

    const stats = {
      users: {
        total: userCount,
        donors: await User.countDocuments({ role: 'donor' }),
        volunteers: await User.countDocuments({ role: 'volunteer' })
      },
      donations: {
        total: donationCount,
        available: await Donation.countDocuments({ status: 'available' }),
        claimed: await Donation.countDocuments({ status: 'claimed' }),
        completed: await Donation.countDocuments({ status: 'completed' })
      },
      pickups: {
        total: pickupCount,
        scheduled: await Pickup.countDocuments({ status: 'scheduled' }),
        completed: await Pickup.countDocuments({ status: 'completed' })
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;