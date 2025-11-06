const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password'); // exclude passwords
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user by ID (admin or self)
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.userId;
  const requesterRole = req.user.role;

  if (requesterRole !== 'admin' && requesterId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Update user (admin or self)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.userId;
  const requesterRole = req.user.role;

  if (requesterRole !== 'admin' && requesterId !== id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const updateData = { ...req.body };

  // If password provided, hash it before updating
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 12);
  }

  // Prevent normal users from changing role
  if (requesterRole !== 'admin' && updateData.role) {
    delete updateData.role;
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
      context: 'query',
    }).select('-password');

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
