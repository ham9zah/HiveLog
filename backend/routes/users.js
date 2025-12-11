const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Get user profile
 */
router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's posts
    const posts = await Post.find({ author: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('title voteScore commentCount createdAt stage');
    
    // Get user's comments count
    const commentCount = await Comment.countDocuments({ 
      author: user._id,
      isDeleted: false 
    });
    
    res.json({
      user,
      stats: {
        postCount: posts.length,
        commentCount,
        karma: user.karma
      },
      recentPosts: posts
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

/**
 * Get user's posts
 */
router.get('/:username/posts', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find({ author: user._id, isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar karma');
    
    const total = await Post.countDocuments({ author: user._id, isActive: true });
    
    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

/**
 * Get user's comments
 */
router.get('/:username/comments', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const comments = await Comment.find({ author: user._id, isDeleted: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar karma')
      .populate('post', 'title');
    
    const total = await Comment.countDocuments({ author: user._id, isDeleted: false });
    
    res.json({
      comments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

module.exports = router;
