const cron = require('node-cron');
const Donation = require('../models/Donation');
const Notification = require('../models/Notification');
const { sendEmail } = require('./emailService');

/**
 * Setup scheduled tasks for the application
 */
const setupScheduledTasks = () => {
  // Check for expired donations every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running scheduled task: checking for expired donations');
    try {
      const now = new Date();
      
      // Find donations that have expired but still marked as available
      const expiredDonations = await Donation.find({
        status: 'available',
        expirationDate: { $lt: now }
      }).populate('donor', 'name email');
      
      console.log(`Found ${expiredDonations.length} expired donations`);
      
      // Update each expired donation and notify donors
      for (const donation of expiredDonations) {
        // Update status to expired
        donation.status = 'expired';
        await donation.save();
        
        // Create notification for donor
        const notification = new Notification({
          recipient: donation.donor._id,
          type: 'donation_expired',
          title: 'Donation Expired',
          message: `Your donation "${donation.foodName}" has expired and is no longer visible to volunteers.`,
          relatedDonation: donation._id
        });
        
        await notification.save();
        
        // Send email notification
        try {
          await sendEmail(
            donation.donor.email,
            'donationExpired',
            [donation.donor.name, donation.foodName]
          );
        } catch (emailError) {
          console.error('Error sending expiration email:', emailError);
          // Continue even if email fails
        }
      }
    } catch (error) {
      console.error('Error in expired donations scheduled task:', error);
    }
  });
  
  // Send reminders for donations about to expire (24 hours before expiry)
  cron.schedule('0 12 * * *', async () => {
    console.log('Running scheduled task: sending expiration reminders');
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Find donations that will expire in the next 24 hours
      const soonToExpireDonations = await Donation.find({
        status: 'available',
        expirationDate: { 
          $gte: now,
          $lte: tomorrow
        }
      }).populate('donor', 'name email');
      
      console.log(`Found ${soonToExpireDonations.length} donations about to expire`);
      
      // Notify donors about soon-to-expire donations
      for (const donation of soonToExpireDonations) {
        // Create notification for donor
        const notification = new Notification({
          recipient: donation.donor._id,
          type: 'system',
          title: 'Donation Expiring Soon',
          message: `Your donation "${donation.foodName}" will expire in less than 24 hours.`,
          relatedDonation: donation._id
        });
        
        await notification.save();
        
        // Send email notification
        try {
          await sendEmail(
            donation.donor.email,
            'donationExpiringSoon',
            [donation.donor.name, donation.foodName]
          );
        } catch (emailError) {
          console.error('Error sending expiration reminder email:', emailError);
          // Continue even if email fails
        }
      }
    } catch (error) {
      console.error('Error in expiration reminders scheduled task:', error);
    }
  });
  
  // Generate weekly statistics report (every Sunday at midnight)
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running scheduled task: generating weekly statistics');
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // Count new donations in the past week
      const newDonations = await Donation.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      });
      
      // Count completed donations in the past week
      const completedDonations = await Donation.countDocuments({
        status: 'completed',
        updatedAt: { $gte: oneWeekAgo }
      });
      
      // Calculate food saved (in kg)
      const completedDonationsData = await Donation.find({
        status: 'completed',
        updatedAt: { $gte: oneWeekAgo }
      });
      
      let totalFoodSaved = 0;
      
      completedDonationsData.forEach(donation => {
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
      
      // Log weekly statistics
      console.log('Weekly Statistics Report:');
      console.log(`- New Donations: ${newDonations}`);
      console.log(`- Completed Donations: ${completedDonations}`);
      console.log(`- Total Food Saved: ${totalFoodSaved.toFixed(2)} kg`);
      
      // Here you could also send this report to admin emails
      // or store it in a statistics collection for later viewing
      
    } catch (error) {
      console.error('Error in weekly statistics scheduled task:', error);
    }
  });
  
  console.log('Scheduled tasks initialized');
};

module.exports = setupScheduledTasks;
