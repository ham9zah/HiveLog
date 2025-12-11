const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetType: {
    type: String,
    required: true,
    enum: ['post', 'comment', 'user']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetModel'
  },
  targetModel: {
    type: String,
    required: true,
    enum: ['Post', 'Comment', 'User']
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',              // محتوى غير مرغوب
      'harassment',        // مضايقة أو تنمر
      'hate_speech',       // خطاب كراهية
      'misinformation',    // معلومات مضللة
      'inappropriate',     // محتوى غير لائق
      'copyright',         // انتهاك حقوق النشر
      'violence',          // عنف أو تهديد
      'other'              // أخرى
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  reviewedAt: {
    type: Date,
    default: null
  },
  reviewNotes: {
    type: String,
    default: null
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'user_banned', 'user_suspended'],
    default: 'none'
  },
  actionDetails: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// فهرس للبحث السريع
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('Report', reportSchema);
