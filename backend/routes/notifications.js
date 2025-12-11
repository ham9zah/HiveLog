const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

// الحصول على إشعارات المستخدم
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      {
        page: parseInt(page),
        limit: parseInt(limit),
        unreadOnly: unreadOnly === 'true'
      }
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'فشل جلب الإشعارات' });
  }
});

// عدد الإشعارات غير المقروءة
router.get('/unread-count', auth, async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.countDocuments({
      recipient: req.user.userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'فشل جلب عدد الإشعارات' });
  }
});

// وضع علامة مقروء على إشعار
router.put('/:id/read', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);

    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user.userId
    );

    if (!notification) {
      return res.status(404).json({ message: 'الإشعار غير موجود' });
    }

    res.json({ message: 'تم وضع علامة مقروء', notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'فشل تحديث الإشعار' });
  }
});

// وضع علامة مقروء على كل الإشعارات
router.put('/read-all', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);

    await notificationService.markAllAsRead(req.user.userId);

    res.json({ message: 'تم وضع علامة مقروء على جميع الإشعارات' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ message: 'فشل تحديث الإشعارات' });
  }
});

// حذف إشعار
router.delete('/:id', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);

    await notificationService.deleteNotification(req.params.id, req.user.userId);

    res.json({ message: 'تم حذف الإشعار' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'فشل حذف الإشعار' });
  }
});

// حذف كل الإشعارات
router.delete('/', auth, async (req, res) => {
  try {
    const io = req.app.get('io');
    const notificationService = new NotificationService(io);

    await notificationService.deleteAllNotifications(req.user.userId);

    res.json({ message: 'تم حذف جميع الإشعارات' });
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    res.status(500).json({ message: 'فشل حذف الإشعارات' });
  }
});

module.exports = router;
