const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const { authenticate, isAdmin, isSuperAdmin, hasPermission } = require('../middleware/auth');

// ==================== إحصائيات لوحة التحكم ====================

/**
 * GET /api/admin/dashboard/stats
 * الحصول على إحصائيات عامة
 */
router.get('/dashboard/stats', authenticate, hasPermission('view_analytics'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      activeUsers,
      pendingReports,
      bannedUsers
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isBanned: true })
    ]);

    // إحصائيات النمو (آخر 7 أيام)
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [newUsers, newPosts, newComments] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      Post.countDocuments({ createdAt: { $gte: last7Days } }),
      Comment.countDocuments({ createdAt: { $gte: last7Days } })
    ]);

    res.json({
      overview: {
        totalUsers,
        totalPosts,
        totalComments,
        activeUsers,
        pendingReports,
        bannedUsers
      },
      growth: {
        newUsers,
        newPosts,
        newComments,
        period: '7 days'
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'فشل جلب الإحصائيات' });
  }
});

// ==================== إدارة المستخدمين ====================

/**
 * GET /api/admin/users
 * الحصول على قائمة المستخدمين
 */
router.get('/users', authenticate, hasPermission('manage_users'), async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search, isBanned } = req.query;

    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (isBanned !== undefined) query.isBanned = isBanned === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('bannedBy', 'username');

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'فشل جلب المستخدمين' });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * تغيير دور المستخدم
 */
router.put('/users/:userId/role', authenticate, isSuperAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const { userId } = req.params;

    if (!['user', 'moderator', 'admin', 'super_admin'].includes(role)) {
      return res.status(400).json({ message: 'دور غير صالح' });
    }

    // لا يمكن تغيير دور نفسك
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك تغيير دورك الخاص' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم تحديث الدور بنجاح', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'فشل تحديث الدور' });
  }
});

/**
 * PUT /api/admin/users/:userId/permissions
 * تعديل صلاحيات المستخدم
 */
router.put('/users/:userId/permissions', authenticate, hasPermission('manage_permissions'), async (req, res) => {
  try {
    const { permissions } = req.body;
    const { userId } = req.params;

    const validPermissions = [
      'manage_users', 'ban_users', 'delete_posts', 'delete_comments',
      'edit_posts', 'pin_posts', 'manage_categories', 'view_reports',
      'manage_reports', 'view_analytics', 'manage_permissions', 'manage_moderators'
    ];

    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({ 
        message: 'صلاحيات غير صالحة', 
        invalid: invalidPermissions 
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { permissions },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم تحديث الصلاحيات بنجاح', user });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ message: 'فشل تحديث الصلاحيات' });
  }
});

/**
 * POST /api/admin/users/:userId/ban
 * حظر مستخدم
 */
router.post('/users/:userId/ban', authenticate, hasPermission('ban_users'), async (req, res) => {
  try {
    const { reason } = req.body;
    const { userId } = req.params;

    if (!reason) {
      return res.status(400).json({ message: 'يجب تحديد سبب الحظر' });
    }

    // لا يمكن حظر نفسك
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك حظر نفسك' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // لا يمكن حظر أدمن أو سوبر أدمن
    if (user.isAdminRole()) {
      return res.status(403).json({ message: 'لا يمكن حظر الأدمن' });
    }

    user.isBanned = true;
    user.banReason = reason;
    user.bannedAt = new Date();
    user.bannedBy = req.user._id;
    await user.save();

    res.json({ message: 'تم حظر المستخدم بنجاح', user });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'فشل حظر المستخدم' });
  }
});

/**
 * POST /api/admin/users/:userId/unban
 * إلغاء حظر مستخدم
 */
router.post('/users/:userId/unban', authenticate, hasPermission('ban_users'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isBanned: false,
        banReason: null,
        bannedAt: null,
        bannedBy: null
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    res.json({ message: 'تم إلغاء حظر المستخدم بنجاح', user });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ message: 'فشل إلغاء الحظر' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * حذف مستخدم
 */
router.delete('/users/:userId', authenticate, isSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // لا يمكن حذف نفسك
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك حذف حسابك الخاص' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود' });
    }

    // لا يمكن حذف سوبر أدمن آخر
    if (user.role === 'super_admin') {
      return res.status(403).json({ message: 'لا يمكن حذف سوبر أدمن' });
    }

    // حذف كل محتوى المستخدم
    await Promise.all([
      Post.deleteMany({ author: userId }),
      Comment.deleteMany({ author: userId }),
      Report.deleteMany({ reporter: userId })
    ]);

    await user.deleteOne();

    res.json({ message: 'تم حذف المستخدم ومحتواه بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'فشل حذف المستخدم' });
  }
});

// ==================== إدارة المحتوى ====================

/**
 * DELETE /api/admin/posts/:postId
 * حذف منشور
 */
router.delete('/posts/:postId', authenticate, hasPermission('delete_posts'), async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    // حذف التعليقات المرتبطة
    await Comment.deleteMany({ post: postId });

    await post.deleteOne();

    res.json({ 
      message: 'تم حذف المنشور بنجاح',
      reason: reason || 'لم يتم تحديد سبب'
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'فشل حذف المنشور' });
  }
});

/**
 * DELETE /api/admin/comments/:commentId
 * حذف تعليق
 */
router.delete('/comments/:commentId', authenticate, hasPermission('delete_comments'), async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'التعليق غير موجود' });
    }

    // حذف الردود المتشعبة
    await Comment.deleteMany({ parentComment: commentId });

    await comment.deleteOne();

    res.json({ message: 'تم حذف التعليق بنجاح' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'فشل حذف التعليق' });
  }
});

/**
 * PUT /api/admin/posts/:postId/pin
 * تثبيت منشور
 */
router.put('/posts/:postId/pin', authenticate, hasPermission('pin_posts'), async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndUpdate(
      postId,
      { isPinned: true, pinnedAt: new Date() },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    res.json({ message: 'تم تثبيت المنشور بنجاح', post });
  } catch (error) {
    console.error('Error pinning post:', error);
    res.status(500).json({ message: 'فشل تثبيت المنشور' });
  }
});

/**
 * PUT /api/admin/posts/:postId/unpin
 * إلغاء تثبيت منشور
 */
router.put('/posts/:postId/unpin', authenticate, hasPermission('pin_posts'), async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findByIdAndUpdate(
      postId,
      { isPinned: false, pinnedAt: null },
      { new: true }
    );

    if (!post) {
      return res.status(404).json({ message: 'المنشور غير موجود' });
    }

    res.json({ message: 'تم إلغاء تثبيت المنشور بنجاح', post });
  } catch (error) {
    console.error('Error unpinning post:', error);
    res.status(500).json({ message: 'فشل إلغاء التثبيت' });
  }
});

// ==================== إدارة البلاغات ====================

/**
 * GET /api/admin/reports
 * الحصول على قائمة البلاغات
 */
router.get('/reports', authenticate, hasPermission('view_reports'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, targetType, reason } = req.query;

    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;
    if (reason) query.reason = reason;

    const reports = await Report.find(query)
      .populate('reporter', 'username email avatar')
      .populate('reviewedBy', 'username')
      .populate({
        path: 'targetId',
        select: 'title content username email'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Report.countDocuments(query);

    res.json({
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'فشل جلب البلاغات' });
  }
});

/**
 * GET /api/admin/reports/:reportId
 * الحصول على تفاصيل بلاغ
 */
router.get('/reports/:reportId', authenticate, hasPermission('view_reports'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.reportId)
      .populate('reporter', 'username email avatar')
      .populate('reviewedBy', 'username')
      .populate({
        path: 'targetId',
        select: 'title content username email author'
      });

    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ message: 'فشل جلب البلاغ' });
  }
});

/**
 * PUT /api/admin/reports/:reportId/status
 * تغيير حالة البلاغ
 */
router.put('/reports/:reportId/status', authenticate, hasPermission('manage_reports'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'حالة غير صالحة' });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    report.status = status;
    if (status === 'reviewing') {
      report.reviewedBy = req.user._id;
      report.reviewedAt = new Date();
    }
    
    await report.save();
    await report.populate([
      { path: 'reporter', select: 'username' },
      { path: 'reviewedBy', select: 'username' }
    ]);

    res.json({ message: 'تم تحديث حالة البلاغ بنجاح', report });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ message: 'فشل تحديث حالة البلاغ' });
  }
});

/**
 * PUT /api/admin/reports/:reportId/resolve
 * حل البلاغ مع اتخاذ إجراء
 */
router.put('/reports/:reportId/resolve', authenticate, hasPermission('manage_reports'), async (req, res) => {
  try {
    const { action, reviewNotes, actionDetails } = req.body;

    if (!action || !['none', 'warning', 'content_removed', 'user_banned', 'user_suspended'].includes(action)) {
      return res.status(400).json({ message: 'إجراء غير صالح' });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    report.status = 'resolved';
    report.action = action;
    report.reviewNotes = reviewNotes;
    report.actionDetails = actionDetails;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();

    // تنفيذ الإجراء
    if (action === 'content_removed') {
      if (report.targetType === 'post') {
        await Post.findByIdAndDelete(report.targetId);
      } else if (report.targetType === 'comment') {
        await Comment.findByIdAndDelete(report.targetId);
      }
    } else if (action === 'user_banned' || action === 'user_suspended') {
      let userId;
      
      if (report.targetType === 'user') {
        userId = report.targetId;
      } else if (report.targetType === 'post') {
        const post = await Post.findById(report.targetId);
        userId = post?.author;
      } else if (report.targetType === 'comment') {
        const comment = await Comment.findById(report.targetId);
        userId = comment?.author;
      }

      if (userId) {
        const banDuration = action === 'user_suspended' ? 7 * 24 * 60 * 60 * 1000 : null; // 7 أيام للتعليق
        await User.findByIdAndUpdate(userId, {
          isBanned: true,
          banReason: reviewNotes || 'انتهاك سياسات المنصة',
          bannedAt: new Date(),
          bannedBy: req.user._id,
          ...(banDuration && { banExpiresAt: new Date(Date.now() + banDuration) })
        });
      }
    }

    await report.populate([
      { path: 'reporter', select: 'username' },
      { path: 'reviewedBy', select: 'username' }
    ]);

    res.json({ 
      message: 'تم حل البلاغ بنجاح',
      report 
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ message: 'فشل حل البلاغ' });
  }
});

/**
 * PUT /api/admin/reports/:reportId/dismiss
 * رفض البلاغ
 */
router.put('/reports/:reportId/dismiss', authenticate, hasPermission('manage_reports'), async (req, res) => {
  try {
    const { reviewNotes } = req.body;

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    report.status = 'dismissed';
    report.action = 'none';
    report.reviewNotes = reviewNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    await report.save();
    await report.populate([
      { path: 'reporter', select: 'username' },
      { path: 'reviewedBy', select: 'username' }
    ]);

    res.json({ 
      message: 'تم رفض البلاغ',
      report 
    });
  } catch (error) {
    console.error('Error dismissing report:', error);
    res.status(500).json({ message: 'فشل رفض البلاغ' });
  }
});

/**
 * GET /api/admin/reports/stats
 * إحصائيات البلاغات
 */
router.get('/reports/stats', authenticate, hasPermission('view_reports'), async (req, res) => {
  try {
    const [
      totalReports,
      pendingReports,
      reviewingReports,
      resolvedReports,
      dismissedReports
    ] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'reviewing' }),
      Report.countDocuments({ status: 'resolved' }),
      Report.countDocuments({ status: 'dismissed' })
    ]);

    // إحصائيات حسب النوع
    const reportsByType = await Report.aggregate([
      { $group: { _id: '$targetType', count: { $sum: 1 } } }
    ]);

    // إحصائيات حسب السبب
    const reportsByReason = await Report.aggregate([
      { $group: { _id: '$reason', count: { $sum: 1 } } }
    ]);

    res.json({
      total: totalReports,
      byStatus: {
        pending: pendingReports,
        reviewing: reviewingReports,
        resolved: resolvedReports,
        dismissed: dismissedReports
      },
      byType: reportsByType,
      byReason: reportsByReason
    });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ message: 'فشل جلب إحصائيات البلاغات' });
  }
});

module.exports = router;
