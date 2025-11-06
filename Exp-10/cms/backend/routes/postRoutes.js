const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const postController = require('../controllers/postController');

// Setup multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ Public route to fetch all posts
router.get('/', postController.getAllPosts);

// ✅ Authenticated routes
router.post(
  '/',
  authenticate,
  upload.single('image'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required'),
  ],
  postController.createPost
);

router.put('/:id', authenticate, upload.single('image'), postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);

// Like/unlike a post
router.post('/:id/like', authenticate, postController.toggleLike);

// Comment routes
router.post('/:id/comments', authenticate, body('text').notEmpty(), postController.addComment);
router.delete('/:postId/comments/:commentId', authenticate, postController.deleteComment);

module.exports = router;
