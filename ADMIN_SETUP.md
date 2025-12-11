# دليل إعداد نظام الإدارة - HiveLog Admin Setup Guide

## نظرة عامة
تم إنشاء نظام إدارة متكامل مع نظام التحكم بالصلاحيات (RBAC) لإدارة المنصة.

## الأدوار المتاحة
1. **user** - مستخدم عادي
2. **moderator** - مشرف (صلاحيات الإشراف على المحتوى)
3. **admin** - مدير (صلاحيات كاملة ماعدا إدارة المدراء)
4. **super_admin** - مدير أعلى (صلاحيات كاملة)

## الصلاحيات الـ 12
- `manage_users` - إدارة المستخدمين
- `manage_posts` - إدارة المنشورات
- `manage_comments` - إدارة التعليقات
- `manage_reports` - إدارة البلاغات
- `manage_roles` - إدارة الأدوار والصلاحيات
- `view_analytics` - عرض الإحصائيات
- `manage_settings` - إدارة الإعدادات
- `manage_categories` - إدارة التصنيفات
- `moderate_content` - الإشراف على المحتوى
- `ban_users` - حظر المستخدمين
- `manage_wiki` - إدارة الويكي
- `access_admin_panel` - الوصول للوحة الإدارة

## خطوات إنشاء أول حساب مدير

### 1. الحصول على المفتاح السري
افتح ملف `.env` في مجلد `backend`:
```bash
cd backend
cat .env | grep ADMIN_SECRET_KEY
```

ستجد المفتاح السري:
```
ADMIN_SECRET_KEY=hivelog-admin-setup-2024
```

### 2. الانتقال لصفحة إنشاء المدير
افتح المتصفح وانتقل إلى:
```
http://localhost:3000/create-admin
```

### 3. ملء البيانات
- **اسم المستخدم**: اختر اسم مستخدم فريد
- **البريد الإلكتروني**: أدخل بريدك الإلكتروني
- **كلمة المرور**: اختر كلمة مرور قوية (8 أحرف على الأقل)
- **المفتاح السري**: أدخل المفتاح من ملف `.env`

### 4. إنشاء الحساب
اضغط على "إنشاء حساب المدير" وسيتم:
- إنشاء حساب Super Admin
- منح جميع الصلاحيات الـ 12
- تسجيل دخولك تلقائياً
- توجيهك للوحة الإدارة

## الوصول للوحة الإدارة

بعد إنشاء حساب المدير، يمكنك الوصول للوحة الإدارة من:
```
http://localhost:3000/admin
```

أو من القائمة الجانبية إذا كنت مسجل دخول كمدير.

## صفحات لوحة الإدارة

### لوحة التحكم الرئيسية (`/admin`)
- إحصائيات عامة (عدد المستخدمين، المنشورات، التعليقات)
- الأنشطة الأخيرة
- البلاغات المعلقة
- رسوم بيانية للنشاط

### إدارة المستخدمين (`/admin/users`)
- عرض جميع المستخدمين
- البحث والتصفية
- تغيير الأدوار والصلاحيات
- حظر/إلغاء حظر المستخدمين
- عرض سجل نشاط المستخدم

### إدارة البلاغات (`/admin/reports`)
- عرض جميع البلاغات
- تصفية حسب الحالة (معلق، قيد المراجعة، تم الحل، مرفوض)
- تصفية حسب النوع (منشور، تعليق، مستخدم)
- اتخاذ إجراءات (حذف المحتوى، حظر المستخدم، رفض البلاغ)
- إضافة ملاحظات

## ملاحظات أمنية مهمة

### حماية المفتاح السري
- ⚠️ **لا تشارك** المفتاح السري مع أحد
- ⚠️ **لا ترفع** ملف `.env` إلى GitHub
- المفتاح السري موجود فقط في الملف: `backend/.env`
- يمكن تغيير المفتاح السري بعد إنشاء المدير

### قيود النظام
- ✅ يمكن إنشاء مدير واحد فقط عبر صفحة `/create-admin`
- ✅ بعد إنشاء أول مدير، لن يعمل هذا الـ endpoint مرة أخرى
- ✅ لإنشاء مدراء إضافيين، استخدم لوحة الإدارة

### تغيير المفتاح السري
بعد إنشاء حساب المدير، يمكنك تغيير المفتاح السري في `.env`:
```bash
# في ملف backend/.env
ADMIN_SECRET_KEY=your-new-secret-key-here
```

## API Endpoints

### إنشاء المدير الأول
```
POST /api/auth/create-admin
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "securePassword123",
  "secretKey": "hivelog-admin-setup-2024"
}
```

Response:
```json
{
  "message": "Admin created successfully",
  "token": "jwt-token-here",
  "user": {
    "_id": "...",
    "username": "admin",
    "email": "admin@example.com",
    "role": "super_admin",
    "permissions": [...all 12 permissions...]
  }
}
```

### Middleware للحماية
- `authenticate` - التحقق من تسجيل الدخول
- `authorize(...permissions)` - التحقق من الصلاحيات المحددة
- `authorizeRole(...roles)` - التحقق من الأدوار المحددة

## استخدام الصلاحيات في الكود

### في Routes
```javascript
const { authenticate, authorize } = require('../middleware/auth');

// يتطلب صلاحية إدارة المستخدمين
router.get('/users', 
  authenticate, 
  authorize('manage_users'), 
  getUsersController
);

// يتطلب أي صلاحية من الصلاحيات
router.delete('/post/:id',
  authenticate,
  authorize('manage_posts', 'moderate_content'),
  deletePostController
);
```

### في Frontend
```javascript
import { useAuthStore } from './stores/authStore';

function AdminPanel() {
  const { user, hasPermission, hasRole } = useAuthStore();
  
  // التحقق من الصلاحية
  if (!hasPermission('access_admin_panel')) {
    return <div>غير مصرح</div>;
  }
  
  // التحقق من الدور
  if (!hasRole('admin', 'super_admin')) {
    return <div>غير مصرح</div>;
  }
  
  return <div>لوحة الإدارة</div>;
}
```

## إصلاح المشاكل

### مشكلة: لا يمكن الوصول للوحة الإدارة
- ✅ تأكد من تسجيل الدخول كمدير
- ✅ تأكد من امتلاك صلاحية `access_admin_panel`
- ✅ افتح Console في المتصفح للتحقق من الأخطاء

### مشكلة: تسجيل الخروج عند التنقل
- ✅ تم إصلاحها: تم إضافة persist middleware لـ Zustand
- ✅ البيانات الآن محفوظة في localStorage

### مشكلة: الردود على التعليقات لا تظهر
- ✅ تم إصلاحها: تم تعديل backend لإرجاع الردود بشكل متداخل
- ✅ الآن يتم جلب جميع الردود تلقائياً مع التعليقات

## البنية التقنية

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Socket.io للإشعارات الفورية

### Frontend
- React 18 + Vite
- Tailwind CSS (Dark Mode دائم، Theme أصفر)
- Zustand (مع persist للحفظ في localStorage)
- React Query للـ data fetching

### Models
- `User` - مع حقول role و permissions
- `Comment` - مع نظام الردود المتداخلة
- `Report` - لإدارة البلاغات
- `Post` - المنشورات مع نظام Wiki

## التواصل والدعم

إذا واجهت أي مشاكل:
1. تحقق من Console في المتصفح
2. تحقق من Backend logs في Terminal
3. راجع هذا الملف للإرشادات

---

**تم إنشاء النظام بواسطة**: GitHub Copilot
**التاريخ**: 2024
**الإصدار**: 1.0.0
