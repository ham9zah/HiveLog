const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    minlength: 5,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    minlength: 10
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['سؤال', 'نقاش', 'فكرة', 'تجربة', 'طلب مساعدة', 'عام']
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'document', 'link']
    },
    url: String,
    name: String,
    size: Number
  }],
  
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
  
  // Post lifecycle stages
  stage: {
    type: String,
    enum: ['sandbox', 'processing', 'wiki'],
    default: 'sandbox'
  },
  
  // Sandbox stage tracking
  sandboxStartDate: {
    type: Date,
    default: Date.now
  },
  sandboxEndDate: {
    type: Date,
    default: null
  },
  
  // Interaction metrics
  viewCount: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  interactionScore: {
    type: Number,
    default: 0
  },
  
  // Wiki generation
  wikiVersion: {
    type: Number,
    default: 0
  },
  lastWikiUpdate: {
    type: Date,
    default: null
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
postSchema.index({ author: 1 });
postSchema.index({ stage: 1 });
postSchema.index({ category: 1 });
postSchema.index({ tags: 1 });
postSchema.index({ voteScore: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ sandboxStartDate: 1 });

// Virtual for vote count
postSchema.virtual('upvoteCount').get(function() {
  return this.upvotes.length;
});

postSchema.virtual('downvoteCount').get(function() {
  return this.downvotes.length;
});

// Calculate interaction score before saving
postSchema.pre('save', function(next) {
  this.voteScore = this.upvotes.length - this.downvotes.length;
  this.interactionScore = (this.upvotes.length * 2) + 
                          (this.downvotes.length * 1) + 
                          (this.commentCount * 3) + 
                          (this.viewCount * 0.1);
  next();
});

// Enable virtuals in JSON
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);
