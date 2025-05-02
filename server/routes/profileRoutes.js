const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { auth } = require('../middleware/auth');

// Get current user's profile
router.get('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profile', error: err.message });
  }
});

// Create or update profile
router.post('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      { ...req.body, userId: req.user._id, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Error saving profile', error: err.message });
  }
});

module.exports = router;
