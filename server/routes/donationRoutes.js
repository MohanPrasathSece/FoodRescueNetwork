const express = require('express');
const router = express.Router();
const multer = require('multer');
const { auth } = require('../middleware/auth');
const Donation = require('../models/Donation');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../services/emailService');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Get all donations (with filters)
router.get('/', async (req, res) => {
  try {
    const { status, foodType, donor } = req.query;
    
    const query = {};
    
    if (status) query.status = status;
    if (foodType) query.foodType = foodType;
    if (donor) query.donor = donor;
    
    const donations = await Donation.find(query)
      .populate('donor', 'name organization')
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get nearby donations with filtering
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, distance = 10, foodType, expiryTimeframe } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'Location coordinates are required' });
    }
    
    // Convert distance to meters for MongoDB geospatial query
    const maxDistance = parseFloat(distance) * 1000;
    
    // Base query
    let query = {
      status: 'available',
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: maxDistance
        }
      }
    };
    
    // Add food type filter if specified
    if (foodType && foodType !== 'all') {
      query.foodType = foodType;
    }
    
    // Add expiry timeframe filter
    if (expiryTimeframe && expiryTimeframe !== 'all') {
      const now = new Date();
      
      if (expiryTimeframe === 'today') {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        query.expirationDate = { $lte: endOfDay, $gte: now };
      } else if (expiryTimeframe === 'tomorrow') {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);
        
        query.expirationDate = { $gte: tomorrow, $lte: endOfTomorrow };
      } else if (expiryTimeframe === 'week') {
        const endOfWeek = new Date(now);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        query.expirationDate = { $lte: endOfWeek, $gte: now };
      }
    }
    
    const donations = await Donation.find(query)
      .populate('donor', 'name organization')
      .sort({ expirationDate: 1 });
    
    // Convert image data to base64 for frontend
    const donationsWithImageUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      
      if (donationObj.image && donationObj.image.data) {
        // Convert buffer to base64 string
        const base64 = donation.image.data.toString('base64');
        donationObj.imageUrl = `data:${donation.image.contentType};base64,${base64}`;
        // Remove the buffer data to reduce payload size
        delete donationObj.image;
      }
      
      return donationObj;
    });
    
    res.json(donationsWithImageUrls);
  } catch (error) {
    console.error('Error fetching nearby donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a single donation by ID
router.get('/:id', async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name organization email phone address')
      .populate('claimedBy', 'name email phone');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Convert image data to base64 for frontend
    const donationObj = donation.toObject();
    
    if (donationObj.image && donationObj.image.data) {
      // Convert buffer to base64 string
      const base64 = donation.image.data.toString('base64');
      donationObj.imageUrl = `data:${donation.image.contentType};base64,${base64}`;
      // Remove the buffer data to reduce payload size
      delete donationObj.image;
    }
    
    res.json(donationObj);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new donation
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    // Verify user is a donor
    if (req.user.role !== 'donor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only donors can create donations' });
    }
    
    const {
      foodName,
      foodType,
      description,
      quantity,
      unit,
      expirationDate,
      pickupAddress,
      pickupInstructions,
      location
    } = req.body;
    
    // Parse JSON strings if needed
    const parsedPickupAddress = typeof pickupAddress === 'string' 
      ? JSON.parse(pickupAddress) 
      : pickupAddress;
    
    const parsedLocation = typeof location === 'string'
      ? JSON.parse(location)
      : location;
    
    // Create new donation
    const newDonation = new Donation({
      donor: req.user.id,
      foodName,
      foodType,
      description,
      quantity,
      unit,
      expirationDate,
      location: parsedLocation,
      pickupAddress: parsedPickupAddress,
      pickupInstructions
    });
    
    // Add image if provided
    if (req.file) {
      newDonation.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    await newDonation.save();
    
    // Populate donor info before sending response
    const populatedDonation = await Donation.findById(newDonation._id)
      .populate('donor', 'name organization');
    
    // Convert image data to base64 for frontend
    const donationObj = populatedDonation.toObject();
    
    if (donationObj.image && donationObj.image.data) {
      // Convert buffer to base64 string
      const base64 = populatedDonation.image.data.toString('base64');
      donationObj.imageUrl = `data:${populatedDonation.image.contentType};base64,${base64}`;
      // Remove the buffer data to reduce payload size
      delete donationObj.image;
    }
    
    res.status(201).json(donationObj);
  } catch (error) {
    console.error('Error creating donation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a donation
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Check if user is the donor or an admin
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }
    
    // Don't allow updates if donation is already claimed
    if (donation.status !== 'available' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update a donation that has been claimed or completed' });
    }
    
    const updateData = req.body;
    
    // Parse JSON fields if needed
    if (updateData.pickupAddress && typeof updateData.pickupAddress === 'string') {
      updateData.pickupAddress = JSON.parse(updateData.pickupAddress);
    }
    
    if (updateData.location && typeof updateData.location === 'string') {
      updateData.location = JSON.parse(updateData.location);
    }
    
    // Update image if provided
    if (req.file) {
      updateData.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype
      };
    }
    
    // Update the donation
    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('donor', 'name organization');
    
    // Convert image data to base64 for frontend
    const donationObj = updatedDonation.toObject();
    
    if (donationObj.image && donationObj.image.data) {
      // Convert buffer to base64 string
      const base64 = updatedDonation.image.data.toString('base64');
      donationObj.imageUrl = `data:${updatedDonation.image.contentType};base64,${base64}`;
      // Remove the buffer data to reduce payload size
      delete donationObj.image;
    }
    
    res.json(donationObj);
  } catch (error) {
    console.error('Error updating donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a donation
router.delete('/:id', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Check if user is the donor or an admin
    if (donation.donor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this donation' });
    }
    
    // Don't allow deletion if donation is already claimed
    if (donation.status === 'claimed' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot delete a donation that has been claimed' });
    }
    
    await donation.remove();
    
    res.json({ message: 'Donation removed' });
  } catch (error) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request a donation
router.post('/:id/request', auth, async (req, res) => {
  try {
    // Verify user is a volunteer
    if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only volunteers can request donations' });
    }
    
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email organization');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'This donation is no longer available' });
    }
    
    // Update donation status to claimed
    donation.status = 'claimed';
    donation.claimedBy = req.user.id;
    await donation.save();
    
    // Get requester info
    const requester = await User.findById(req.user.id);
    
    // Create notification for donor
    const notification = new Notification({
      recipient: donation.donor._id,
      sender: req.user.id,
      type: 'donation_request',
      title: 'New Donation Request',
      message: `${requester.name} has requested your donation: ${donation.foodName}`,
      relatedDonation: donation._id
    });
    
    await notification.save();
    
    // Send email notification to donor
    try {
      await sendEmail(
        donation.donor.email,
        'donationRequest',
        [donation.donor.name, donation.foodName, requester.name]
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Continue even if email fails
    }
    
    // Convert image data to base64 for frontend
    const donationObj = donation.toObject();
    
    if (donationObj.image && donationObj.image.data) {
      // Convert buffer to base64 string
      const base64 = donation.image.data.toString('base64');
      donationObj.imageUrl = `data:${donation.image.contentType};base64,${base64}`;
      // Remove the buffer data to reduce payload size
      delete donationObj.image;
    }
    
    res.json({ message: 'Donation request successful', donation: donationObj });
  } catch (error) {
    console.error('Error requesting donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark donation as completed
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email')
      .populate('claimedBy', 'name email');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    // Check authorization
    const isClaimant = donation.claimedBy && donation.claimedBy._id.toString() === req.user.id;
    const isDonor = donation.donor._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    if (!isClaimant && !isDonor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to complete this donation' });
    }
    
    if (donation.status !== 'claimed') {
      return res.status(400).json({ message: 'Only claimed donations can be marked as completed' });
    }
    
    // Update donation status
    donation.status = 'completed';
    await donation.save();
    
    // Create notifications for both parties
    const donorNotification = new Notification({
      recipient: donation.donor._id,
      sender: donation.claimedBy._id,
      type: 'pickup_completed',
      title: 'Donation Pickup Completed',
      message: `${donation.claimedBy.name} has completed the pickup for ${donation.foodName}`,
      relatedDonation: donation._id
    });
    
    const volunteerNotification = new Notification({
      recipient: donation.claimedBy._id,
      sender: donation.donor._id,
      type: 'pickup_completed',
      title: 'Donation Pickup Completed',
      message: `You have successfully picked up ${donation.foodName} from ${donation.donor.name}`,
      relatedDonation: donation._id
    });
    
    await Promise.all([
      donorNotification.save(),
      volunteerNotification.save()
    ]);
    
    // Send email notifications
    try {
      const thankYouMessage = req.body.thankYouMessage || '';
      
      await sendEmail(
        donation.donor.email,
        'pickupCompleted',
        [donation.donor.name, donation.foodName, thankYouMessage]
      );
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Continue even if email fails
    }
    
    // Convert image data to base64 for frontend
    const donationObj = donation.toObject();
    
    if (donationObj.image && donationObj.image.data) {
      // Convert buffer to base64 string
      const base64 = donation.image.data.toString('base64');
      donationObj.imageUrl = `data:${donation.image.contentType};base64,${base64}`;
      // Remove the buffer data to reduce payload size
      delete donationObj.image;
    }
    
    res.json({ message: 'Donation marked as completed', donation: donationObj });
  } catch (error) {
    console.error('Error completing donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's donation history
router.get('/user/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let donations;
    if (req.user.role === 'donor') {
      // For donors, get donations they've created
      donations = await Donation.find({ donor: userId })
        .populate('claimedBy', 'name organization')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'volunteer') {
      // For volunteers, get donations they've claimed
      donations = await Donation.find({ claimedBy: userId })
        .populate('donor', 'name organization')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Convert image data to base64 for frontend
    const donationsWithImageUrls = donations.map(donation => {
      const donationObj = donation.toObject();
      
      if (donationObj.image && donationObj.image.data) {
        // Convert buffer to base64 string
        const base64 = donation.image.data.toString('base64');
        donationObj.imageUrl = `data:${donation.image.contentType};base64,${base64}`;
        // Remove the buffer data to reduce payload size
        delete donationObj.image;
      }
      
      return donationObj;
    });
    
    res.json(donationsWithImageUrls);
  } catch (error) {
    console.error('Error fetching donation history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
