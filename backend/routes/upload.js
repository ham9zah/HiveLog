const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

// رفع صورة واحدة
router.post('/image', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم رفع أي ملف' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      message: 'تم رفع الملف بنجاح',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'فشل رفع الملف', error: error.message });
  }
});

// رفع عدة صور (حتى 5)
router.post('/images', authenticate, upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'لم يتم رفع أي ملفات' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/${file.filename}`
    }));

    res.status(200).json({
      message: 'تم رفع الملفات بنجاح',
      files: files
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'فشل رفع الملفات', error: error.message });
  }
});

// حذف ملف
router.delete('/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'الملف غير موجود' });
    }

    // حذف الملف
    fs.unlinkSync(filePath);

    res.status(200).json({ message: 'تم حذف الملف بنجاح' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'فشل حذف الملف', error: error.message });
  }
});

module.exports = router;
