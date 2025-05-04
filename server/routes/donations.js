const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Create new donation (supports image upload)
router.post('/', auth, authorize('donor'), upload.single('image'), async (req, res) => {
  try {
    const { body, file } = req;
    // Parse pickupAddress if sent as JSON string
    let pickupAddress = body.pickupAddress;
    if (typeof pickupAddress === 'string') {
      try { pickupAddress = JSON.parse(pickupAddress); } catch {}
    }
    const donation = new Donation({
      donor: req.user._id,
      status: 'available',
      foodName: body.foodName,
      description: body.description,
      quantity: body.quantity,
      unit: body.unit,
      expirationDate: body.expirationDate,
      pickupAddress,
      foodType: body.foodType || 'produce',
      location: body.location || { type: 'Point', coordinates: [0, 0] },
      ...(file && { image: { data: file.buffer, contentType: file.mimetype } })
    });
    
    await donation.save();
    res.status(201).json(donation);
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(400).json({ message: 'Error creating donation', error: error.message });
  }
});

// Get all donations (for admin/analytics, not for donors/volunteers)
router.get('/', auth, async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name organization')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching all donations:', error);
    res.status(500).json({ message: 'Error fetching all donations', error: error.message, stack: error.stack });
  }
});

// Get all available donations (public, no auth)
router.get('/available', async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'available' })
      .populate('donor', 'name organization')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Get donor's donations
router.get('/my-donations', auth, authorize('donor'), async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('claimedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donations', error: error.message });
  }
});

// Get single donation
router.get('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name organization phone address')
      .populate('claimedBy', 'name phone');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching donation', error: error.message });
  }
});

// Update donation
router.patch('/:id', auth, authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user._id });
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Cannot update claimed or completed donation' });
    }

    Object.assign(donation, req.body);
    await donation.save();
    res.json(donation);
  } catch (error) {
    res.status(400).json({ message: 'Error updating donation', error: error.message });
  }
});

// Claim a donation
router.post('/:id/claim', auth, authorize('volunteer'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Donation is not available' });
    }

    donation.status = 'claimed';
    donation.claimedBy = req.user._id;
    donation.pickupTime = req.body.pickupTime;

    await donation.save();

    // Create pickup record
    const pickup = new Pickup({
      donation: donation._id,
      volunteer: req.user._id,
      scheduledTime: req.body.pickupTime
    });

    await pickup.save();

    // Send email notification to donor
    if (donation.donor && donation.donor.email) {
      try {
        await emailService.sendEmail(
          donation.donor.email,
          'donationRequest',
          [donation.donor.name, donation.foodName || donation.title, req.user.name]
        );
      } catch (emailErr) {
        console.error('Error sending donor notification:', emailErr);
      }
    }

    res.json({ donation, pickup });
  } catch (error) {
    res.status(400).json({ message: 'Error claiming donation', error: error.message });
  }
});

// Complete donation pickup
router.post('/:id/complete', auth, authorize('volunteer'), async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      claimedBy: req.user._id,
      status: 'claimed'
    });

    if (!donation) {
      return res.status(404).json({ message: 'Claimed donation not found' });
    }

    donation.status = 'completed';
    await donation.save();

    const pickup = await Pickup.findOne({
      donation: donation._id,
      volunteer: req.user._id,
      status: 'scheduled'
    });

    if (pickup) {
      pickup.status = 'completed';
      pickup.completionNotes = req.body.notes;
      pickup.completionPhotos = req.body.photos;
      await pickup.save();
    }

    res.json({ donation, pickup });
  } catch (error) {
    res.status(400).json({ message: 'Error completing pickup', error: error.message });
  }
});

// Delete donation by donor
router.delete('/:id', auth, authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user._id });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Cannot delete claimed or completed donation' });
    }
    // Delete donation using findByIdAndDelete
    await Donation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Donation deleted' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Error deleting donation', error: error.message });
  }
});

module.exports = router;