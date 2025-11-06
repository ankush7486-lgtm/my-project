const Post = require('../models/Post');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

// GET /posts
exports.getAllPosts = async (req, res) => {
  try {
    let filter = {};

    // Secure filtering: return only user's posts if ?mine=true
    if (req.query.mine === 'true') {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      filter.author = req.user._id;
    }

    let posts = await Post.find(filter)
      .populate('author', 'username role')
      .populate('comments.user', 'username')
      .lean();

    posts = posts.map(post => {
      const likesCount = post.likes?.length || 0;
      const likedByCurrentUser = req.user
        ? post.likes?.some(id => id.toString() === req.user._id.toString())
        : false;

      return {
        ...post,
        likesCount,
        likedByCurrentUser
      };
    });

    res.json(posts);
  } catch (err) {
    console.error('Failed to get posts:', err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// POST /posts
exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const post = new Post({ title, content, image, author: req.user._id });
    await post.save();

    res.status(201).json(post);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /posts/:id
exports.updatePost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const post = await Post.findOne(filter);
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });

    // Delete old image if a new one is uploaded
    if (req.file && post.image) {
      const oldImagePath = path.join(__dirname, '../uploads', post.image);
      fs.unlink(oldImagePath, err => {
        if (err) console.error('Failed to delete old image:', err);
      });
    }

    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;

    Object.assign(post, updateData);
    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// DELETE /posts/:id
exports.deletePost = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const post = await Post.findOne(filter);
    if (!post) return res.status(404).json({ error: 'Post not found or unauthorized' });

    if (post.image) {
      const imagePath = path.join(__dirname, '../uploads', post.image);
      fs.unlink(imagePath, err => {
        if (err) console.error('Failed to delete image:', err);
      });
    }

    await Post.deleteOne({ _id: post._id });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// PUT /posts/:id/like
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const userId = req.user._id.toString();
    const index = post.likes.findIndex(id => id.toString() === userId);

    if (index === -1) {
      post.likes.push(req.user._id); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }

    await post.save();

    res.json({
      likesCount: post.likes.length,
      likedByCurrentUser: post.likes.some(id => id.toString() === userId)
    });
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
};

// POST /posts/:id/comments
exports.addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = {
      user: req.user._id,
      text,
    };

    post.comments.push(comment);
    await post.save();

    const updatedPost = await Post.findById(req.params.id)
      .populate('comments.user', 'username')
      .lean();

    res.status(201).json(updatedPost.comments);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// DELETE /posts/:postId/comments/:commentId
// DELETE /posts/:postId/comments/:commentId
exports.deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    // Fetch the post by ID
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Find the comment by ID
    const comment = post.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    // Check if the user is authorized (owner of comment or admin)
    const isOwner = comment.user?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Remove the comment
    comment.deleteOne(); // safer alternative to .remove()

    await post.save();

    res.status(200).json({ success: true, message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
};
