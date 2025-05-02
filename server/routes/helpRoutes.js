const express = require('express');
const router = express.Router();

// Log all helpRoutes requests
router.use((req, res, next) => {
  console.log(`[helpRoutes] ${req.method} ${req.path}`);
  next();
});

// Log route initialization
console.log('Mounted helpRoutes at /api/help');
const Help = require('../models/Help');

// Fetch all help submissions
router.get('/', async (req, res) => {
  try {
    const helps = await Help.find().sort({ createdAt: -1 });
    res.json({ success: true, helps });
  } catch (err) {
    console.error('Error fetching helps:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new help submission
router.post('/', async (req, res) => {
  try {
    const help = await Help.create(req.body);
    res.status(201).json({ success: true, help });
  } catch (err) {
    console.error('Error saving help:', err);
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
