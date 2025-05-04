const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Avatar storage config
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/avatars')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const avatarUpload = multer({ storage: avatarStorage, limits: { fileSize: 2 * 1024 * 1024 } });

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields: name, email, password, and role' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Validate role
    const validRoles = ['donor', 'volunteer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Role must be one of: donor, volunteer, admin' });
    }
    
    console.log('Register attempt:', { name, email, role });

    // Check MongoDB connection before proceeding
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB connection is not established');
      return res.status(500).json({ message: 'Database connection error. Please try again later.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email }).catch(err => {
      console.error('Error checking existing user:', err);
      return null;
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Extract optional fields
    const { organization, phone, address } = req.body;
    
    const user = new User({
      name,
      email,
      password,
      role,
      organization: organization || '',
      phone: phone || '',
      address: address || {}
    });

    await user.save().catch(err => {
      console.error('Error saving user:', err);
      throw new Error('Failed to save user to database');
    });

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile (with optional avatar upload)
router.patch('/profile', auth, avatarUpload.single('avatar'), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['name', 'email', 'phone', 'avatar', 'organization', 'address'];
  // Allow nested address fields like address[street]
  const isValidOperation = updates.every(update => allowedUpdates.includes(update) || update.startsWith('address['));

  if (!isValidOperation) {
    return res.status(400).json({ message: 'Invalid updates' });
  }

  try {
    // Log incoming updates for debugging
    console.log('PATCH /profile updates:', req.body);
    // handle avatar file
    if (req.file) {
      req.user.avatar = '/uploads/avatars/' + req.file.filename;
    }
    // Handle nested address fields
    let addressUpdated = false;
    updates.filter(u => u.startsWith('address[')).forEach(key => {
      const field = key.match(/address\[(.+)\]/)[1];
      req.user.address = req.user.address || {};
      if (req.body[key] !== undefined && req.body[key] !== '') {
        req.user.address[field] = req.body[key];
        addressUpdated = true;
      }
    });
    if (addressUpdated) req.user.markModified('address');
    // Handle other fields
    updates.filter(u => !u.startsWith('address[')).forEach(update => {
      if (update !== 'address') {
        if (req.body[update] !== undefined && req.body[update] !== '') {
          req.user[update] = req.body[update];
        }
      }
    });
    await req.user.save();
    // Always return updated user without password
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(400).json({ message: 'Error updating profile', error: error.message });
  }
});

module.exports = router;