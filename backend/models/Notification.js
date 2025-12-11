const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'comment',           // تعليق على منشورك
      'reply',             // رد على تعليقك
      'vote',              // تصويت على منشورك/تعليقك
      'mention',           // ذكرك في تعليق
      'wiki_ready',        // تحول منشورك لويكي
      'post_transition',   // منشورك انتقل لمرحلة جديدة
      'follow'             // متابعة جديدة
    ]
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  comment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // سيتم حذف الإشعارات تلقائياً بعد 30 يوم
  }
});

// فهرس مركب للبحث السريع
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
