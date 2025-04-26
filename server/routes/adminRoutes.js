const express = require('express');
const router = express.Router();
const { auth, adminAuth } = require('../middleware/auth');
const User = require('../models/User');
const Donation = require('../models/Donation');
const Pickup = require('../models/Pickup');
const Notification = require('../models/Notification');

// Admin authorization middleware
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Get dashboard statistics
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalVolunteers = await User.countDocuments({ role: 'volunteer' });
    
    // Get donation statistics
    const totalDonations = await Donation.countDocuments();
    const activeDonations = await Donation.countDocuments({ status: 'available' });
    const completedDonations = await Donation.countDocuments({ status: 'completed' });
    
    // Calculate total food saved (in kg)
    const donations = await Donation.find({ status: 'completed' });
    let totalFoodSaved = 0;
    
    donations.forEach(donation => {
      // Convert all units to kg for calculation
      let quantityInKg = donation.quantity;
      
      if (donation.unit === 'g') {
        quantityInKg = donation.quantity / 1000;
      } else if (donation.unit === 'lb') {
        quantityInKg = donation.quantity * 0.453592;
      } else if (donation.unit === 'oz') {
        quantityInKg = donation.quantity * 0.0283495;
      } else if (donation.unit === 'servings' || donation.unit === 'items') {
        // Estimate average weight per serving/item as 0.3kg
        quantityInKg = donation.quantity * 0.3;
      }
      
      totalFoodSaved += quantityInKg;
    });
    
    // Get weekly and monthly statistics
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const weeklyDonations = await Donation.countDocuments({ 
      createdAt: { $gte: oneWeekAgo } 
    });
    
    const monthlyDonations = await Donation.countDocuments({ 
      createdAt: { $gte: oneMonthAgo } 
    });
    
    res.json({
      totalUsers,
      totalDonors,
      totalVolunteers,
      totalDonations,
      activeDonations,
      completedDonations,
      totalFoodSaved: Math.round(totalFoodSaved * 100) / 100, // Round to 2 decimal places
      weeklyDonations,
      monthlyDonations
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user status
router.patch('/users/:id', auth, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create notification for the user
    const notification = new Notification({
      recipient: user._id,
      sender: req.user.id,
      type: 'system',
      title: `Account ${status === 'active' ? 'Activated' : 'Deactivated'}`,
      message: `Your account has been ${status === 'active' ? 'activated' : 'deactivated'} by an administrator.`
    });
    
    await notification.save();
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all donations
router.get('/donations', auth, isAdmin, async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate('donor', 'name email organization')
      .populate('claimedBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(donations);
  } catch (error) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get donation by ID
router.get('/donations/:id', auth, isAdmin, async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email organization phone address')
      .populate('claimedBy', 'name email phone');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    res.json(donation);
  } catch (error) {
    console.error('Error fetching donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Moderate donation (approve/remove)
router.patch('/donations/:id', auth, isAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    
    if (!['approve', 'remove'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }
    
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email');
    
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }
    
    if (action === 'remove') {
      // Mark as expired instead of deleting
      donation.status = 'expired';
      await donation.save();
      
      // Notify the donor
      const notification = new Notification({
        recipient: donation.donor._id,
        sender: req.user.id,
        type: 'system',
        title: 'Donation Removed',
        message: `Your donation "${donation.foodName}" has been removed by an administrator.`,
        relatedDonation: donation._id
      });
      
      await notification.save();
    }
    
    res.json({ message: `Donation ${action === 'approve' ? 'approved' : 'removed'}` });
  } catch (error) {
    console.error('Error moderating donation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pickups
router.get('/pickups', auth, isAdmin, async (req, res) => {
  try {
    const pickups = await Pickup.find()
      .populate({
        path: 'donation',
        populate: {
          path: 'donor',
          select: 'name email organization'
        }
      })
      .populate('volunteer', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(pickups);
  } catch (error) {
    console.error('Error fetching pickups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pickup by ID
router.get('/pickups/:id', auth, isAdmin, async (req, res) => {
  try {
    const pickup = await Pickup.findById(req.params.id)
      .populate({
        path: 'donation',
        populate: {
          path: 'donor',
          select: 'name email organization phone address'
        }
      })
      .populate('volunteer', 'name email phone');
    
    if (!pickup) {
      return res.status(404).json({ message: 'Pickup not found' });
    }
    
    res.json(pickup);
  } catch (error) {
    console.error('Error fetching pickup:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate reports
router.get('/reports/:type', auth, isAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    
    // Parse dates if provided
    const start = startDate ? new Date(startDate) : new Date(0);
    const end = endDate ? new Date(endDate) : new Date();
    
    let report = {};
    
    if (type === 'donations') {
      // Donation statistics
      const totalDonations = await Donation.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });
      
      const donationsByStatus = await Donation.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      const donationsByType = await Donation.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$foodType', count: { $sum: 1 } } }
      ]);
      
      report = {
        totalDonations,
        donationsByStatus: donationsByStatus.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        donationsByType: donationsByType.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    } else if (type === 'users') {
      // User statistics
      const totalUsers = await User.countDocuments({
        createdAt: { $gte: start, $lte: end }
      });
      
      const usersByRole = await User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      report = {
        totalUsers,
        usersByRole: usersByRole.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      };
    } else {
      return res.status(400).json({ message: 'Invalid report type' });
    }
    
    res.json({
      reportType: type,
      timeframe: { start, end },
      data: report
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
