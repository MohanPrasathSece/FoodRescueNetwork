const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Pickup = require('../models/Pickup');
const Donation = require('../models/Donation');

// GET /api/pickups/my-pickups - Get pickups for the authenticated volunteer
router.get('/my-pickups', auth, async (req, res) => {
  try {
    const pickups = await Pickup.find({ volunteer: req.user._id })
      .populate({ path: 'donation', select: 'foodName description expirationDate status image' })
      .sort({ createdAt: -1 });
    res.json(pickups);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pickups', error: error.message });
  }
});

// PATCH /api/pickups/:id/complete - Mark pickup as completed
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id);
    if (!pickup) return res.status(404).json({ message: 'Pickup not found' });
    // Only assigned volunteer can complete
    if (pickup.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    pickup.status = 'completed';
    await pickup.save();
    res.json(pickup);
  } catch (err) {
    res.status(500).json({ message: 'Error completing pickup', error: err.message });
  }
});

module.exports = router;
