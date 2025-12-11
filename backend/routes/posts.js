const express = require('express');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Create new post
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, content, category, tags, attachments } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }
    
    const post = new Post({
      title,
      content,
      category,
      tags: tags || [],
      attachments: attachments || [],
      author: req.userId
    });
    
    await post.save();
    await post.populate('author', 'username avatar karma');
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

/**
 * Get all posts with filters and pagination
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { 
      stage, 
      category, 
      sort = 'recent', 
      page = 1, 
      limit = 20,
      search 
    } = req.query;
    
    const query = { isActive: true };
    
    if (stage) query.stage = stage;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    let sortOption = {};
    switch (sort) {
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'popular':
        sortOption = { voteScore: -1, createdAt: -1 };
        break;
      case 'trending':
        sortOption = { interactionScore: -1, createdAt: -1 };
        break;
      case 'discussed':
        sortOption = { commentCount: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const posts = await Post.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'username avatar karma')
      .lean();
    
    const total = await Post.countDocuments(query);
    
    // Add user vote status if authenticated
    if (req.userId) {
      posts.forEach(post => {
        post.userVote = post.upvotes.some(id => id.equals(req.userId)) ? 'up' :
                        post.downvotes.some(id => id.equals(req.userId)) ? 'down' : null;
      });
    }
    
    res.json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
});

/**
 * Get single post by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar karma bio');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    // Get user vote status if authenticated
    let userVote = null;
    if (req.userId) {
      userVote = post.upvotes.some(id => id.equals(req.userId)) ? 'up' :
                 post.downvotes.some(id => id.equals(req.userId)) ? 'down' : null;
    }
    
    const postObj = post.toObject();
    postObj.userVote = userVote;
    
    res.json({ post: postObj });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
});

/**
 * Vote on post
 */
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { voteType } = req.body; // 'up', 'down', or 'remove'
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Remove existing votes
    post.upvotes = post.upvotes.filter(id => !id.equals(req.userId));
    post.downvotes = post.downvotes.filter(id => !id.equals(req.userId));
    
    // Add new vote
    if (voteType === 'up') {
      post.upvotes.push(req.userId);
    } else if (voteType === 'down') {
      post.downvotes.push(req.userId);
    }
    
    await post.save();
    
    // Update author karma
    const karmaChange = voteType === 'up' ? 1 : voteType === 'down' ? -1 : 0;
    if (karmaChange !== 0) {
      await User.findByIdAndUpdate(post.author, { $inc: { karma: karmaChange } });
    }
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`post-${post._id}`).emit('post-vote-update', {
      postId: post._id,
      voteScore: post.voteScore,
      upvoteCount: post.upvotes.length,
      downvoteCount: post.downvotes.length
    });
    
    res.json({
      message: 'Vote recorded',
      voteScore: post.voteScore,
      userVote: voteType === 'remove' ? null : voteType
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

/**
 * Update post
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (!post.author.equals(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { title, content, tags } = req.body;
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags;
    
    await post.save();
    
    res.json({ message: 'Post updated', post });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Failed to update post' });
  }
});

/**
 * Delete post
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (!post.author.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    post.isActive = false;
    await post.save();
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

module.exports = router;
