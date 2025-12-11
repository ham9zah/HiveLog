const Notification = require('../models/Notification');

class NotificationService {
  constructor(io) {
    this.io = io;
  }

  // إنشاء إشعار جديد
  async createNotification({ recipient, sender, type, post, comment, message, link }) {
    try {
      // لا ترسل إشعار للشخص نفسه
      if (recipient.toString() === sender.toString()) {
        return null;
      }

      const notification = await Notification.create({
        recipient,
        sender,
        type,
        post,
        comment,
        message,
        link
      });

      // تعبئة بيانات المرسل
      await notification.populate('sender', 'username');

      // إرسال الإشعار عبر Socket.io
      this.io.to(`user-${recipient}`).emit('new-notification', notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // إشعار بتعليق جديد على منشور
  async notifyNewComment(comment, post) {
    if (post.author.toString() === comment.author.toString()) {
      return; // لا ترسل إشعار للمؤلف نفسه
    }

    await this.createNotification({
      recipient: post.author,
      sender: comment.author,
      type: 'comment',
      post: post._id,
      comment: comment._id,
      message: 'علّق على منشورك',
      link: `/post/${post._id}`
    });
  }

  // إشعار برد على تعليق
  async notifyReply(reply, parentComment) {
    if (parentComment.author.toString() === reply.author.toString()) {
      return;
    }

    await this.createNotification({
      recipient: parentComment.author,
      sender: reply.author,
      type: 'reply',
      post: reply.post,
      comment: reply._id,
      message: 'رد على تعليقك',
      link: `/post/${reply.post}`
    });
  }

  // إشعار بتصويت على منشور
  async notifyPostVote(post, voter) {
    if (post.author.toString() === voter.toString()) {
      return;
    }

    await this.createNotification({
      recipient: post.author,
      sender: voter,
      type: 'vote',
      post: post._id,
      message: 'صوّت على منشورك',
      link: `/post/${post._id}`
    });
  }

  // إشعار بتحول المنشور إلى ويكي
  async notifyWikiReady(post) {
    await this.createNotification({
      recipient: post.author,
      sender: post.author, // إشعار نظام
      type: 'wiki_ready',
      post: post._id,
      message: 'تم تحويل منشورك إلى ويكي متجدد',
      link: `/wiki/${post._id}`
    });
  }

  // إشعار بانتقال المنشور لمرحلة جديدة
  async notifyPostTransition(post, newStage) {
    const stageNames = {
      sandbox: 'النقاش النشط',
      processing: 'قيد المعالجة',
      wiki: 'ويكي متجدد'
    };

    await this.createNotification({
      recipient: post.author,
      sender: post.author,
      type: 'post_transition',
      post: post._id,
      message: `انتقل منشورك إلى مرحلة ${stageNames[newStage]}`,
      link: `/post/${post._id}`
    });
  }

  // جلب إشعارات المستخدم
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      read: false 
    });

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      unreadCount
    };
  }

  // وضع علامة مقروء على إشعار
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { read: true },
      { new: true }
    );

    return notification;
  }

  // وضع علامة مقروء على كل الإشعارات
  async markAllAsRead(userId) {
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return true;
  }

  // حذف إشعار
  async deleteNotification(notificationId, userId) {
    await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId
    });

    return true;
  }

  // حذف كل الإشعارات
  async deleteAllNotifications(userId) {
    await Notification.deleteMany({ recipient: userId });
    return true;
  }
}

module.exports = NotificationService;
