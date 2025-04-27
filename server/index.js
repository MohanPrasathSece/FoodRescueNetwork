const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

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
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Food Rescue Hub API' });
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

// Use the PORT from environment variables instead of hardcoding
const PORT = process.env.PORT || 5000;

// Function to try starting the server on different ports
const startServer = (port, maxAttempts = 5) => {
  let attempts = 0;
  
  const tryPort = (currentPort) => {
    attempts++;
    // Ensure port is a number and within valid range
    const portNumber = parseInt(currentPort, 10);
    if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
      console.error(`Invalid port number: ${currentPort}. Using default port 8080.`);
      currentPort = 8080;
    }
    
    const server = app.listen(currentPort, () => {
      console.log(`Server running on port ${currentPort}`);
      // Update environment variable to reflect actual port used
      process.env.PORT = currentPort.toString();
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempts < maxAttempts) {
        const nextPort = currentPort + 1;
        console.error(`Port ${currentPort} is already in use. Trying port ${nextPort}...`);
        tryPort(nextPort);
      } else if (attempts >= maxAttempts) {
        console.error(`Failed to find an available port after ${maxAttempts} attempts.`);
        console.error('Please manually specify an available port in the .env file.');
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  };
  
  tryPort(parseInt(port, 10));
};


// Start the server
startServer(PORT);