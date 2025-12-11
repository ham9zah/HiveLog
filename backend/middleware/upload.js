const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إنشاء مجلد التخزين إذا لم يكن موجوداً
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// تكوين التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // إنشاء اسم فريد للملف
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// فلتر أنواع الملفات المسموحة
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح. الأنواع المسموحة: jpeg, jpg, png, gif, pdf, doc, docx, txt'));
  }
};

// إعداد multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB حد أقصى
  },
  fileFilter: fileFilter
});

module.exports = upload;
