const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { sendEmail } = require('./services/emailService');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Verify environment variables are loaded
console.log('Environment variables loaded:', {
  PORT: process.env.PORT,
  MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
  JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
  EMAIL_CONFIG_EXISTS: !!process.env.EMAIL_USER
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected Successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  // Log more detailed error information
  if (err.name === 'MongoServerSelectionError') {
    console.error('Could not connect to MongoDB server. Please check your connection string and network.');
  } else if (err.name === 'MongoParseError') {
    console.error('Invalid MongoDB connection string format. Please check your MONGODB_URI in .env file.');
  } else if (err.name === 'MongooseError') {
    console.error('Mongoose connection error. Please check if MongoDB service is running.');
  } else if (err.name === 'MongoNetworkError') {
    console.error('Network error occurred. Please check your internet connection and firewall settings.');
  }
  console.error('Connection string used (redacted password):', 
    process.env.MONGODB_URI.replace(/\x2F\x2F([^:]+):([^@]+)@/, '\x2F\x2F$1:****@'));
});

// Import routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const helpRoutes = require('./routes/helpRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pickups', pickupRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Rescue Hub API' });
});

// Test email endpoint
app.get('/api/test-email', async (req, res) => {
  try {
    const result = await sendEmail(
      process.env.EMAIL_USER,
      'donationRequest',
      ['Test Donor', 'Test Food', 'Test Requester']
    );
    res.json(result);
  } catch (err) {
    console.error('Test email failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scheduled tasks for automatic expiration of donations
const setupScheduledTasks = require('./services/scheduledTasks');
setupScheduledTasks();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle multer errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'File is too large. Maximum size is 5MB.' 
      });
    }
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});