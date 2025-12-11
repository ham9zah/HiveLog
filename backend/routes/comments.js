const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { authenticate, optionalAuth } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

/**
 * Recursively populate replies for a comment
 */
async function populateReplies(comment, userId, maxDepth = 5) {
  if (comment.depth >= maxDepth) {
    comment.replies = [];
    return comment;
  }

  const replies = await Comment.find({
    parentComment: comment._id,
    isDeleted: false
  })
    .sort({ voteScore: -1, createdAt: -1 })
    .populate('author', 'username avatar karma')
    .lean();

  // Add user vote status if authenticated
  if (userId) {
    replies.forEach(reply => {
      reply.userVote = reply.upvotes.some(id => id.equals(userId)) ? 'upvote' :
                      reply.downvotes.some(id => id.equals(userId)) ? 'downvote' : null;
    });
  }

  // Recursively populate replies for each reply
  comment.replies = await Promise.all(
    replies.map(reply => populateReplies(reply, userId, maxDepth))
  );

  return comment;
}

/**
 * Create new comment
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { postId, content, parentComment, attachments } = req.body;
    
    if (!postId || !content) {
      return res.status(400).json({ message: 'Post ID and content are required' });
    }
    
    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Calculate depth for nested comments
    let depth = 0;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (parent) {
        depth = parent.depth + 1;
        if (depth > 10) {
          return res.status(400).json({ message: 'Maximum nesting depth reached' });
        }
      }
    }
    
    const comment = new Comment({
      post: postId,
      author: req.userId,
      content,
      parentComment: parentComment || null,
      depth,
      attachments: attachments || []
    });
    
    await comment.save();
    await comment.populate('author', 'username avatar karma');
    
    // Update post comment count
    post.commentCount += 1;
    await post.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`post-${postId}`).emit('new-comment', {
      comment: comment.toObject(),
      postId
    });
    
    // إرسال إشعار
    const notificationService = new NotificationService(io);
    if (parentComment) {
      // إشعار برد على تعليق
      const parent = await Comment.findById(parentComment).populate('author');
      if (parent) {
        await notificationService.notifyReply(comment, parent);
      }
    } else {
      // إشعار بتعليق جديد على المنشور
      await notificationService.notifyNewComment(comment, post);
    }
    
    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

/**
 * Get comments for a post
 */
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const { sort = 'best' } = req.query;
    
    const query = {
      post: req.params.postId,
      isDeleted: false,
      parentComment: null  // Only get top-level comments
    };
    
    let sortOption = {};
    switch (sort) {
      case 'best':
        sortOption = { voteScore: -1, createdAt: -1 };
        break;
      case 'recent':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      default:
        sortOption = { voteScore: -1 };
    }
    
    const topLevelComments = await Comment.find(query)
      .sort(sortOption)
      .populate('author', 'username avatar karma')
      .lean();
    
    // Add user vote status if authenticated
    if (req.userId) {
      topLevelComments.forEach(comment => {
        comment.userVote = comment.upvotes.some(id => id.equals(req.userId)) ? 'upvote' :
                          comment.downvotes.some(id => id.equals(req.userId)) ? 'downvote' : null;
      });
    }
    
    // Recursively populate replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(comment => populateReplies(comment, req.userId))
    );
    
    res.json({ comments: commentsWithReplies });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

/**
 * Get single comment with its thread
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username avatar karma');
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Get user vote status if authenticated
    let userVote = null;
    if (req.userId) {
      userVote = comment.upvotes.some(id => id.equals(req.userId)) ? 'up' :
                 comment.downvotes.some(id => id.equals(req.userId)) ? 'down' : null;
    }
    
    const commentObj = comment.toObject();
    commentObj.userVote = userVote;
    
    res.json({ comment: commentObj });
  } catch (error) {
    console.error('Get comment error:', error);
    res.status(500).json({ message: 'Failed to fetch comment' });
  }
});

/**
 * Vote on comment
 */
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { voteType } = req.body;
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Remove existing votes
    comment.upvotes = comment.upvotes.filter(id => !id.equals(req.userId));
    comment.downvotes = comment.downvotes.filter(id => !id.equals(req.userId));
    
    // Add new vote
    if (voteType === 'up') {
      comment.upvotes.push(req.userId);
    } else if (voteType === 'down') {
      comment.downvotes.push(req.userId);
    }
    
    await comment.save();
    
    // Emit socket event
    const io = req.app.get('io');
    io.to(`post-${comment.post}`).emit('comment-vote-update', {
      commentId: comment._id,
      voteScore: comment.voteScore,
      upvoteCount: comment.upvotes.length,
      downvoteCount: comment.downvotes.length
    });
    
    res.json({
      message: 'Vote recorded',
      voteScore: comment.voteScore,
      userVote: voteType === 'remove' ? null : voteType
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Failed to record vote' });
  }
});

/**
 * Update comment
 */
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (!comment.author.equals(req.userId)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { content } = req.body;
    
    if (content) {
      comment.content = content;
      comment.isEdited = true;
      comment.editedAt = new Date();
    }
    
    await comment.save();
    
    res.json({ message: 'Comment updated', comment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

/**
 * Delete comment
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    if (!comment.author.equals(req.userId) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    comment.isDeleted = true;
    comment.deletedAt = new Date();
    comment.content = '[تم حذف التعليق]';
    await comment.save();
    
    // Update post comment count
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

module.exports = router;
