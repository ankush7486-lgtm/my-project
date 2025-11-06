const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Register user
router.post(
  '/register',
  [
    body('username').isLength({ min: 3 }).withMessage('Username min length is 3'),
    body('password').isLength({ min: 5 }).withMessage('Password min length is 5'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;

    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const user = new User({ username, password });
      await user.save();

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.json({
        token,
        user: { _id: user._id, username: user.username },  // Include _id here
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Login user
router.post(
  '/login',
  [
    body('username').exists().withMessage('Username is required'),
    body('password').exists().withMessage('Password is required'),
  ],
  async (req, res) => {
    console.log('Login request:', req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

      res.json({
        token,
        user: { _id: user._id, username: user.username },  // Include _id here
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Get current logged-in user info
router.get('/me', authenticate, (req, res) => {
  // Return both _id and username for frontend filtering
  res.json({
    _id: req.user._id,
    username: req.user.username,
  });
});

module.exports = router;
