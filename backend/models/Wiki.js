const mongoose = require('mongoose');

const wikiSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
    unique: true
  },
  
  // Wiki content
  summary: {
    type: String,
    required: true
  },
  
  // Organized opinions
  opinions: {
    supporting: [{
      text: String,
      sourceComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }],
      strength: {
        type: String,
        enum: ['strong', 'moderate', 'weak']
      }
    }],
    opposing: [{
      text: String,
      sourceComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }],
      strength: {
        type: String,
        enum: ['strong', 'moderate', 'weak']
      }
    }],
    neutral: [{
      text: String,
      sourceComments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
      }]
    }]
  },
  
  // Key points
  keyPoints: [{
    title: String,
    description: String,
    sourceComments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment'
    }],
    importance: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  
  // Organized attachments
  attachments: {
    images: [{
      url: String,
      caption: String,
      source: String
    }],
    videos: [{
      url: String,
      caption: String,
      source: String
    }],
    links: [{
      url: String,
      title: String,
      description: String,
      source: String
    }],
    documents: [{
      url: String,
      name: String,
      source: String
    }]
  },
  
  // Pending questions for further discussion
  pendingQuestions: [{
    question: String,
    context: String,
    importance: {
      type: String,
      enum: ['high', 'medium', 'low']
    }
  }],
  
  // Conclusion
  conclusion: {
    type: String,
    default: ''
  },
  
  // Metadata
  version: {
    type: Number,
    required: true,
    default: 1
  },
  generatedBy: {
    type: String,
    default: 'AI'
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Statistics from original discussion
  discussionStats: {
    totalComments: Number,
    uniqueParticipants: Number,
    discussionDuration: Number, // in hours
    peakActivity: Date
  },
  
  // Quality metrics
  completeness: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'disputed'],
    default: 'pending'
  },
  
  // Version history
  previousVersions: [{
    version: Number,
    generatedAt: Date,
    summary: String,
    changes: String
  }]
}, {
  timestamps: true
});

// Indexes
wikiSchema.index({ post: 1 });
wikiSchema.index({ version: -1 });
wikiSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model('Wiki', wikiSchema);
