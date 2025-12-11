const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 10000
  },
  
  // Nested comments (threading)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  depth: {
    type: Number,
    default: 0,
    max: 10 // Maximum nesting depth
  },
  
  // Voting system
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  voteScore: {
    type: Number,
    default: 0
  },
  
  // Attachments
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'link', 'document']
    },
    url: String,
    name: String
  }],
  
  // Comment quality indicators
  isHighQuality: {
    type: Boolean,
    default: false
  },
  qualityScore: {
    type: Number,
    default: 0
  },
  
  // Status
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  
  // For wiki inclusion
  includedInWiki: {
    type: Boolean,
    default: false
  },
  wikiVersion: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
commentSchema.index({ post: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ voteScore: -1 });
commentSchema.index({ createdAt: -1 });
commentSchema.index({ isHighQuality: 1 });

// Calculate vote score and quality before saving
commentSchema.pre('save', function(next) {
  this.voteScore = this.upvotes.length - this.downvotes.length;
  
  // High quality if vote score > 10 or length > 200 chars with positive score
  this.qualityScore = this.voteScore + (this.content.length / 100);
  this.isHighQuality = this.voteScore > 10 || 
                       (this.content.length > 200 && this.voteScore > 5);
  
  next();
});

// Virtual for reply count
commentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema);
