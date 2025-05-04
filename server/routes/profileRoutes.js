const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const { auth } = require('../middleware/auth');
const multer = require('multer');

// Configure multer for memory storage (avatar uploads)
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

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

// Create or update profile (with optional avatar upload)
router.post('/', auth, upload.single('avatar'), async (req, res) => {
  try {
    // Build update data
    const updateData = { userId: req.user._id, updatedAt: new Date() };
    // Handle avatar file
    if (req.file) {
      updateData.avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    // Append fields from body
    ['name','email','phone'].forEach(field => {
      if (req.body[field]) updateData[field] = req.body[field];
    });
    // Parse nested address fields
    const addr = {};
    ['street','city','state','zipCode'].forEach(key => {
      const field = `address[${key}]`;
      if (req.body[field]) addr[key] = req.body[field];
    });
    if (Object.keys(addr).length) updateData.address = addr;
    // Upsert profile
    const profile = await Profile.findOneAndUpdate(
      { userId: req.user._id },
      updateData,
      { upsert: true, new: true }
    );
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: 'Error saving profile', error: err.message });
  }
});

module.exports = router;
