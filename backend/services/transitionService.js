const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Wiki = require('../models/Wiki');
const { synthesizeDiscussion } = require('./aiService');

/**
 * Check if post should transition from sandbox to wiki
 */
function shouldTransition(post) {
  const daysSinceStart = (Date.now() - post.sandboxStartDate) / (1000 * 60 * 60 * 24);
  const minDays = parseInt(process.env.AI_SYNTHESIS_DELAY_DAYS) || 30;
  const minInteractions = parseInt(process.env.MIN_INTERACTION_THRESHOLD) || 50;
  
  // Transition if 30 days passed OR reached interaction threshold
  return daysSinceStart >= minDays || post.interactionScore >= minInteractions;
}

/**
 * Check all sandbox posts and transition eligible ones
 */
async function checkAndTransitionPosts(io) {
  try {
    const sandboxPosts = await Post.find({ 
      stage: 'sandbox',
      isActive: true 
    });
    
    let transitionedCount = 0;
    
    for (const post of sandboxPosts) {
      if (shouldTransition(post)) {
        await transitionPostToWiki(post, io);
        transitionedCount++;
      }
    }
    
    console.log(`✅ Transitioned ${transitionedCount} posts to wiki stage`);
    return transitionedCount;
  } catch (error) {
    console.error('Error in checkAndTransitionPosts:', error);
    throw error;
  }
}

/**
 * Transition a single post from sandbox to wiki
 */
async function transitionPostToWiki(post, io) {
  try {
    console.log(`🔄 Starting transition for post: ${post._id}`);
    
    // Update post stage to processing
    post.stage = 'processing';
    await post.save();
    
    // Notify users via socket
    if (io) {
      io.to(`post-${post._id}`).emit('post-transition-started', {
        postId: post._id,
        stage: 'processing'
      });
    }
    
    // Get all comments for this post
    const comments = await Comment.find({ 
      post: post._id,
      isDeleted: false 
    })
    .populate('author', 'username avatar')
    .sort({ voteScore: -1 });
    
    console.log(`📝 Processing ${comments.length} comments...`);
    
    // Generate wiki using AI
    const wikiContent = await synthesizeDiscussion(post, comments);
    
    // Calculate discussion stats
    const uniqueParticipants = new Set(comments.map(c => c.author._id.toString())).size;
    const discussionDuration = (Date.now() - post.sandboxStartDate) / (1000 * 60 * 60); // hours
    
    // Create wiki document
    const wiki = new Wiki({
      post: post._id,
      summary: wikiContent.summary,
      opinions: wikiContent.opinions,
      keyPoints: wikiContent.keyPoints,
      pendingQuestions: wikiContent.pendingQuestions,
      conclusion: wikiContent.conclusion,
      version: 1,
      discussionStats: {
        totalComments: comments.length,
        uniqueParticipants,
        discussionDuration,
        peakActivity: post.createdAt // You can calculate this more accurately
      },
      completeness: calculateCompleteness(wikiContent)
    });
    
    await wiki.save();
    
    // Update post to wiki stage
    post.stage = 'wiki';
    post.sandboxEndDate = new Date();
    post.wikiVersion = 1;
    post.lastWikiUpdate = new Date();
    await post.save();
    
    console.log(`✅ Successfully created wiki for post: ${post._id}`);
    
    // Notify users via socket
    if (io) {
      io.to(`post-${post._id}`).emit('post-transition-completed', {
        postId: post._id,
        stage: 'wiki',
        wikiId: wiki._id
      });
    }
    
    return wiki;
  } catch (error) {
    console.error('Error in transitionPostToWiki:', error);
    
    // Revert post stage on error
    post.stage = 'sandbox';
    await post.save();
    
    throw error;
  }
}

/**
 * Calculate wiki completeness score
 */
function calculateCompleteness(wikiContent) {
  let score = 0;
  
  // Summary exists and is substantial
  if (wikiContent.summary && wikiContent.summary.length > 100) score += 30;
  
  // Has opinions from multiple sides
  if (wikiContent.opinions?.supporting?.length > 0) score += 15;
  if (wikiContent.opinions?.opposing?.length > 0) score += 15;
  
  // Has key points
  if (wikiContent.keyPoints && wikiContent.keyPoints.length >= 3) score += 20;
  
  // Has conclusion
  if (wikiContent.conclusion && wikiContent.conclusion.length > 50) score += 10;
  
  // Has pending questions
  if (wikiContent.pendingQuestions && wikiContent.pendingQuestions.length > 0) score += 10;
  
  return Math.min(score, 100);
}

/**
 * Manually trigger transition for a post
 */
async function manualTransition(postId, io) {
  const post = await Post.findById(postId);
  
  if (!post) {
    throw new Error('Post not found');
  }
  
  if (post.stage !== 'sandbox') {
    throw new Error('Post is not in sandbox stage');
  }
  
  return await transitionPostToWiki(post, io);
}

module.exports = {
  shouldTransition,
  checkAndTransitionPosts,
  transitionPostToWiki,
  manualTransition
};
