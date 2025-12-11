const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { authenticate, hasPermission } = require('../middleware/auth');

/**
 * POST /api/reports
 * إنشاء بلاغ جديد
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !targetId || !reason || !description) {
      return res.status(400).json({ message: 'جميع الحقول مطلوبة' });
    }

    // التحقق من وجود الهدف
    let targetModel;
    let target;
    
    if (targetType === 'post') {
      targetModel = 'Post';
      target = await Post.findById(targetId);
    } else if (targetType === 'comment') {
      targetModel = 'Comment';
      target = await Comment.findById(targetId);
    } else if (targetType === 'user') {
      targetModel = 'User';
      target = await User.findById(targetId);
    } else {
      return res.status(400).json({ message: 'نوع الهدف غير صالح' });
    }

    if (!target) {
      return res.status(404).json({ message: 'الهدف غير موجود' });
    }

    // لا يمكن الإبلاغ عن نفسك
    if (targetType === 'user' && targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'لا يمكنك الإبلاغ عن نفسك' });
    }

    // التحقق من عدم تكرار البلاغ
    const existingReport = await Report.findOne({
      reporter: req.user._id,
      targetType,
      targetId,
      status: { $in: ['pending', 'reviewing'] }
    });

    if (existingReport) {
      return res.status(400).json({ message: 'لديك بلاغ قيد المراجعة على هذا العنصر' });
    }

    const report = new Report({
      reporter: req.user._id,
      targetType,
      targetId,
      targetModel,
      reason,
      description
    });

    await report.save();
    await report.populate('reporter', 'username');

    res.status(201).json({ 
      message: 'تم إرسال البلاغ بنجاح',
      report 
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ message: 'فشل إرسال البلاغ' });
  }
});

/**
 * GET /api/reports
 * الحصول على قائمة البلاغات (للمشرفين)
 */
router.get('/', authenticate, hasPermission('view_reports'), async (req, res) => {
  try {
    const { page = 1, limit = 20, status, targetType, reason } = req.query;

    const query = {};
    if (status) query.status = status;
    if (targetType) query.targetType = targetType;
    if (reason) query.reason = reason;

    const reports = await Report.find(query)
      .populate('reporter', 'username email')
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
 * GET /api/reports/:id
 * الحصول على تفاصيل بلاغ
 */
router.get('/:id', authenticate, hasPermission('view_reports'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
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
 * PUT /api/reports/:id/review
 * مراجعة بلاغ
 */
router.put('/:id/review', authenticate, hasPermission('manage_reports'), async (req, res) => {
  try {
    const { status, action, reviewNotes, actionDetails } = req.body;

    if (!status || !action) {
      return res.status(400).json({ message: 'الحالة والإجراء مطلوبان' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    report.status = status;
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
        await User.findByIdAndUpdate(userId, {
          isBanned: true,
          banReason: reviewNotes || 'انتهاك سياسات المنصة',
          bannedAt: new Date(),
          bannedBy: req.user._id
        });
      }
    }

    await report.populate([
      { path: 'reporter', select: 'username' },
      { path: 'reviewedBy', select: 'username' }
    ]);

    res.json({ 
      message: 'تم مراجعة البلاغ بنجاح',
      report 
    });
  } catch (error) {
    console.error('Error reviewing report:', error);
    res.status(500).json({ message: 'فشل مراجعة البلاغ' });
  }
});

/**
 * DELETE /api/reports/:id
 * حذف بلاغ
 */
router.delete('/:id', authenticate, hasPermission('manage_reports'), async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ message: 'البلاغ غير موجود' });
    }

    res.json({ message: 'تم حذف البلاغ بنجاح' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ message: 'فشل حذف البلاغ' });
  }
});

/**
 * GET /api/reports/my-reports
 * الحصول على بلاغات المستخدم الحالي
 */
router.get('/my-reports', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reports = await Report.find({ reporter: req.user._id })
      .populate('reviewedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Report.countDocuments({ reporter: req.user._id });

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
    console.error('Error fetching user reports:', error);
    res.status(500).json({ message: 'فشل جلب بلاغاتك' });
  }
});

module.exports = router;
