const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Protect all routes below
router.use(authenticate);

// GET all users (admin only)
router.get('/', roleMiddleware(['admin']), userController.getAllUsers);

// GET user by ID (admin or self)
router.get('/:id', userController.getUserById);

// PUT update user (admin or self)
router.put(
  '/:id',
  [
    body('username').optional().isLength({ min: 3 }).withMessage('Username min length is 3'),
    body('password').optional().isLength({ min: 5 }).withMessage('Password min length is 5'),
    body('role').optional().isIn(['admin', 'editor', 'user']).withMessage('Invalid role'),
  ],
  userController.updateUser
);

// DELETE user (admin only)
router.delete('/:id', roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
