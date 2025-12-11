const express = require('express');
const Wiki = require('../models/Wiki');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { authenticate, optionalAuth, isAdmin } = require('../middleware/auth');
const { manualTransition } = require('../services/transitionService');
const { updateWiki } = require('../services/aiService');

const router = express.Router();

/**
 * Get wiki for a post
 */
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const wiki = await Wiki.findOne({ post: req.params.postId })
      .populate('post', 'title category tags author createdAt')
      .populate({
        path: 'post',
        populate: { path: 'author', select: 'username avatar karma' }
      })
      .lean();
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found for this post' });
    }
    
    res.json({ wiki });
  } catch (error) {
    console.error('Get wiki error:', error);
    res.status(500).json({ message: 'Failed to fetch wiki' });
  }
});

/**
 * Get wiki by ID
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.id)
      .populate('post')
      .populate({
        path: 'opinions.supporting.sourceComments',
        populate: { path: 'author', select: 'username avatar' }
      })
      .populate({
        path: 'opinions.opposing.sourceComments',
        populate: { path: 'author', select: 'username avatar' }
      });
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found' });
    }
    
    res.json({ wiki });
  } catch (error) {
    console.error('Get wiki error:', error);
    res.status(500).json({ message: 'Failed to fetch wiki' });
  }
});

/**
 * Manually trigger wiki generation for a post (admin only)
 */
router.post('/generate/:postId', authenticate, isAdmin, async (req, res) => {
  try {
    const io = req.app.get('io');
    const wiki = await manualTransition(req.params.postId, io);
    
    res.json({
      message: 'Wiki generated successfully',
      wiki
    });
  } catch (error) {
    console.error('Generate wiki error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to generate wiki' 
    });
  }
});

/**
 * Request wiki update based on new high-quality comments
 */
router.post('/update/:postId', authenticate, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    if (post.stage !== 'wiki') {
      return res.status(400).json({ message: 'Post is not in wiki stage' });
    }
    
    const wiki = await Wiki.findOne({ post: req.params.postId });
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found' });
    }
    
    // Get new high-quality comments since last wiki update
    const newComments = await Comment.find({
      post: req.params.postId,
      isHighQuality: true,
      createdAt: { $gt: wiki.generatedAt },
      isDeleted: false
    })
    .populate('author', 'username avatar')
    .sort({ voteScore: -1 })
    .limit(10);
    
    if (newComments.length === 0) {
      return res.status(400).json({ message: 'No significant new comments to update wiki' });
    }
    
    // Generate updated wiki content
    const updatedContent = await updateWiki(wiki, newComments, post);
    
    // Save previous version
    wiki.previousVersions.push({
      version: wiki.version,
      generatedAt: wiki.generatedAt,
      summary: wiki.summary,
      changes: 'Previous version before update'
    });
    
    // Update wiki
    wiki.version += 1;
    wiki.summary = updatedContent.summary;
    wiki.opinions = updatedContent.opinions;
    wiki.keyPoints = updatedContent.keyPoints;
    wiki.pendingQuestions = updatedContent.pendingQuestions;
    wiki.conclusion = updatedContent.conclusion;
    wiki.generatedAt = new Date();
    
    await wiki.save();
    
    // Update post
    post.wikiVersion = wiki.version;
    post.lastWikiUpdate = new Date();
    await post.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`post-${post._id}`).emit('wiki-updated', {
      postId: post._id,
      wikiVersion: wiki.version,
      changes: updatedContent.changes
    });
    
    res.json({
      message: 'Wiki updated successfully',
      wiki,
      changes: updatedContent.changes
    });
  } catch (error) {
    console.error('Update wiki error:', error);
    res.status(500).json({ message: 'Failed to update wiki' });
  }
});

/**
 * Verify wiki content (mark as verified)
 */
router.patch('/:id/verify', authenticate, async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.id);
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found' });
    }
    
    wiki.verificationStatus = 'verified';
    await wiki.save();
    
    res.json({ message: 'Wiki verified', wiki });
  } catch (error) {
    console.error('Verify wiki error:', error);
    res.status(500).json({ message: 'Failed to verify wiki' });
  }
});

/**
 * Dispute wiki content
 */
router.patch('/:id/dispute', authenticate, async (req, res) => {
  try {
    const { reason } = req.body;
    const wiki = await Wiki.findById(req.params.id);
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found' });
    }
    
    wiki.verificationStatus = 'disputed';
    await wiki.save();
    
    res.json({ message: 'Wiki disputed', wiki });
  } catch (error) {
    console.error('Dispute wiki error:', error);
    res.status(500).json({ message: 'Failed to dispute wiki' });
  }
});

/**
 * Get wiki version history
 */
router.get('/:id/versions', optionalAuth, async (req, res) => {
  try {
    const wiki = await Wiki.findById(req.params.id)
      .select('version previousVersions generatedAt');
    
    if (!wiki) {
      return res.status(404).json({ message: 'Wiki not found' });
    }
    
    res.json({
      currentVersion: wiki.version,
      versions: wiki.previousVersions
    });
  } catch (error) {
    console.error('Get versions error:', error);
    res.status(500).json({ message: 'Failed to fetch versions' });
  }
});

module.exports = router;
