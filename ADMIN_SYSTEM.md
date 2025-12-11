# نظام الإدارة والصلاحيات - HiveLog

## نظرة عامة

تم تطوير نظام إدارة شامل لمنصة HiveLog يتضمن:
- **نظام الأدوار (RBAC)**: 4 أدوار مختلفة مع صلاحيات متدرجة
- **نظام البلاغات**: للإبلاغ عن المحتوى المخالف
- **لوحة تحكم إدارية**: لإدارة المستخدمين والمحتوى
- **نظام الحظر**: لحظر المستخدمين المخالفين

---

## الأدوار والصلاحيات

### 1. المستخدم العادي (user)
- الدور الافتراضي لجميع المستخدمين الجدد
- إنشاء المنشورات والتعليقات
- الإبلاغ عن المحتوى المخالف
- لا يملك صلاحيات إدارية

### 2. المشرف (moderator)
يملك الصلاحيات التالية:
- `view_reports` - عرض البلاغات
- `manage_reports` - مراجعة وحل البلاغات
- `delete_posts` - حذف المنشورات
- `delete_comments` - حذف التعليقات
- `pin_posts` - تثبيت المنشورات

### 3. المدير (admin)
يملك جميع صلاحيات المشرف بالإضافة إلى:
- `manage_users` - إدارة المستخدمين
- `ban_users` - حظر المستخدمين
- `edit_posts` - تعديل المنشورات
- `view_analytics` - عرض الإحصائيات
- `manage_categories` - إدارة التصنيفات

### 4. المدير الأعلى (super_admin)
يملك جميع الصلاحيات بالإضافة إلى:
- `manage_permissions` - تعديل صلاحيات المستخدمين
- `manage_moderators` - تعيين وإلغاء تعيين المشرفين
- تغيير أدوار المستخدمين
- حذف المستخدمين نهائياً

---

## نظام البلاغات (Reports)

### أنواع البلاغات

1. **spam** - رسائل مزعجة
2. **harassment** - مضايقة
3. **hate_speech** - خطاب كراهية
4. **misinformation** - معلومات مضللة
5. **inappropriate** - محتوى غير لائق
6. **copyright** - انتهاك حقوق الطبع
7. **violence** - عنف
8. **other** - أخرى

### دورة حياة البلاغ

```
pending (معلق) 
   ↓
reviewing (قيد المراجعة)
   ↓
resolved / dismissed (تم الحل / مرفوض)
```

### الإجراءات المتاحة

1. **none** - لا شيء
2. **warning** - تحذير
3. **content_removed** - حذف المحتوى
4. **user_banned** - حظر المستخدم
5. **user_suspended** - تعليق المستخدم (7 أيام)

---

## API Endpoints

### إدارة المستخدمين

#### الحصول على قائمة المستخدمين
```http
GET /api/admin/users?page=1&limit=20&role=all&search=
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `manage_users`

**المعاملات**:
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج (افتراضي: 20)
- `role`: تصفية حسب الدور (all, user, moderator, admin, super_admin)
- `search`: البحث عن مستخدم
- `banned`: تصفية المحظورين (true/false)

**الاستجابة**:
```json
{
  "users": [
    {
      "_id": "...",
      "username": "user1",
      "email": "user@example.com",
      "role": "user",
      "isBanned": false,
      "permissions": [],
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### تغيير دور المستخدم
```http
PUT /api/admin/users/:userId/role
Authorization: Bearer {token}
Content-Type: application/json

{
  "role": "moderator"
}
```

**الصلاحية المطلوبة**: `super_admin` فقط

**الأدوار المتاحة**: `user`, `moderator`, `admin`, `super_admin`

#### تحديث صلاحيات المستخدم
```http
PUT /api/admin/users/:userId/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": ["view_reports", "manage_reports"]
}
```

**الصلاحية المطلوبة**: `manage_permissions`

#### حظر مستخدم
```http
POST /api/admin/users/:userId/ban
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "انتهاك سياسات المنصة"
}
```

**الصلاحية المطلوبة**: `ban_users`

#### إلغاء حظر مستخدم
```http
POST /api/admin/users/:userId/unban
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `ban_users`

#### حذف مستخدم
```http
DELETE /api/admin/users/:userId
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `super_admin` فقط

**ملاحظة**: يتم حذف جميع محتويات المستخدم (منشورات، تعليقات، إلخ)

---

### إدارة المحتوى

#### حذف منشور
```http
DELETE /api/admin/posts/:postId
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `delete_posts`

#### حذف تعليق
```http
DELETE /api/admin/comments/:commentId
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `delete_comments`

#### تثبيت منشور
```http
PUT /api/admin/posts/:postId/pin
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `pin_posts`

#### إلغاء تثبيت منشور
```http
PUT /api/admin/posts/:postId/unpin
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `pin_posts`

---

### إدارة البلاغات

#### الحصول على قائمة البلاغات
```http
GET /api/admin/reports?page=1&limit=20&status=pending&targetType=all
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `view_reports`

**المعاملات**:
- `status`: pending, reviewing, resolved, dismissed
- `targetType`: post, comment, user
- `reason`: نوع السبب

#### الحصول على تفاصيل بلاغ
```http
GET /api/admin/reports/:reportId
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `view_reports`

#### تغيير حالة البلاغ
```http
PUT /api/admin/reports/:reportId/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "reviewing"
}
```

**الصلاحية المطلوبة**: `manage_reports`

#### حل البلاغ
```http
PUT /api/admin/reports/:reportId/resolve
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "content_removed",
  "reviewNotes": "المحتوى يخالف سياسات المنصة",
  "actionDetails": "تم حذف المنشور"
}
```

**الصلاحية المطلوبة**: `manage_reports`

**الإجراءات المتاحة**:
- `none`: لا شيء
- `warning`: تحذير
- `content_removed`: حذف المحتوى
- `user_banned`: حظر المستخدم
- `user_suspended`: تعليق المستخدم (7 أيام)

#### رفض البلاغ
```http
PUT /api/admin/reports/:reportId/dismiss
Authorization: Bearer {token}
Content-Type: application/json

{
  "reviewNotes": "البلاغ غير صحيح"
}
```

**الصلاحية المطلوبة**: `manage_reports`

#### إحصائيات البلاغات
```http
GET /api/admin/reports/stats
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `view_reports`

**الاستجابة**:
```json
{
  "total": 100,
  "byStatus": {
    "pending": 20,
    "reviewing": 10,
    "resolved": 60,
    "dismissed": 10
  },
  "byType": [
    { "_id": "post", "count": 50 },
    { "_id": "comment", "count": 30 },
    { "_id": "user", "count": 20 }
  ],
  "byReason": [
    { "_id": "spam", "count": 40 },
    { "_id": "harassment", "count": 30 }
  ]
}
```

---

### إحصائيات لوحة التحكم

#### الحصول على الإحصائيات العامة
```http
GET /api/admin/dashboard/stats
Authorization: Bearer {token}
```

**الصلاحية المطلوبة**: `view_analytics`

**الاستجابة**:
```json
{
  "overview": {
    "totalUsers": 1000,
    "totalPosts": 5000,
    "totalComments": 15000,
    "activeUsers": 200,
    "pendingReports": 10,
    "bannedUsers": 5
  },
  "growth": {
    "newUsers": 50,
    "newPosts": 200,
    "newComments": 500
  }
}
```

---

## إنشاء بلاغ (للمستخدمين)

### إنشاء بلاغ جديد
```http
POST /api/reports
Authorization: Bearer {token}
Content-Type: application/json

{
  "targetType": "post",
  "targetId": "post_id_here",
  "reason": "spam",
  "description": "هذا المنشور يحتوي على رسائل مزعجة"
}
```

**الاستجابة**:
```json
{
  "message": "تم إرسال البلاغ بنجاح",
  "report": {
    "_id": "...",
    "reporter": { "username": "user1" },
    "targetType": "post",
    "reason": "spam",
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### الحصول على بلاغاتي
```http
GET /api/reports/my-reports?page=1&limit=10
Authorization: Bearer {token}
```

---

## صفحات لوحة التحكم (Frontend)

### 1. لوحة التحكم الرئيسية
**المسار**: `/admin`

**المحتوى**:
- بطاقات الإحصائيات (إجمالي المستخدمين، المنشورات، البلاغات المعلقة، إلخ)
- إحصائيات النمو (آخر 7 أيام)
- إجراءات سريعة (إدارة المستخدمين، المحتوى، البلاغات، الصلاحيات)

### 2. إدارة المستخدمين
**المسار**: `/admin/users`

**الميزات**:
- عرض قائمة المستخدمين مع التصفية والبحث
- تغيير الأدوار (super_admin فقط)
- تعديل الصلاحيات
- حظر/إلغاء حظر المستخدمين
- حذف المستخدمين (super_admin فقط)
- عرض حالة المستخدم (نشط/محظور)

### 3. إدارة البلاغات
**المسار**: `/admin/reports`

**الميزات**:
- عرض قائمة البلاغات مع التصفية حسب الحالة والنوع
- عرض تفاصيل البلاغ
- حل البلاغ مع اختيار الإجراء
- رفض البلاغ
- عرض ملاحظات المراجعة

---

## نموذج البيانات

### User Model
```javascript
{
  username: String,
  email: String,
  password: String,
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'ban_users',
      'delete_posts',
      'delete_comments',
      'edit_posts',
      'pin_posts',
      'manage_categories',
      'view_reports',
      'manage_reports',
      'view_analytics',
      'manage_permissions',
      'manage_moderators'
    ]
  }],
  isBanned: { type: Boolean, default: false },
  banReason: String,
  bannedAt: Date,
  bannedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}
```

### Report Model
```javascript
{
  reporter: { type: Schema.Types.ObjectId, ref: 'User' },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'user'],
    required: true
  },
  targetId: { type: Schema.Types.ObjectId, required: true },
  targetModel: { type: String, enum: ['Post', 'Comment', 'User'] },
  reason: {
    type: String,
    enum: [
      'spam',
      'harassment',
      'hate_speech',
      'misinformation',
      'inappropriate',
      'copyright',
      'violence',
      'other'
    ]
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'resolved', 'dismissed'],
    default: 'pending'
  },
  action: {
    type: String,
    enum: ['none', 'warning', 'content_removed', 'user_banned', 'user_suspended']
  },
  reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: String,
  actionDetails: String
}
```

---

## Middleware للصلاحيات

### authenticate
التحقق من JWT token وتحميل بيانات المستخدم

### isAdmin
التحقق من أن المستخدم مدير (admin أو super_admin)

### isSuperAdmin
التحقق من أن المستخدم مدير أعلى (super_admin)

### isModerator
التحقق من أن المستخدم مشرف (moderator, admin, super_admin)

### hasPermission(permission)
التحقق من امتلاك المستخدم لصلاحية معينة

**مثال**:
```javascript
router.delete('/posts/:id', 
  authenticate, 
  hasPermission('delete_posts'), 
  deletePost
);
```

### isNotBanned
التحقق من عدم حظر المستخدم

---

## الأمان

### 1. التحقق من الصلاحيات
- يتم التحقق من الصلاحيات في كل endpoint
- المديرون الأعلى فقط يمكنهم تغيير الأدوار وحذف المستخدمين
- يتم منع المستخدمين المحظورين من أي إجراءات

### 2. حماية البيانات
- جميع endpoints محمية بـ JWT authentication
- لا يمكن للمستخدم الإبلاغ عن نفسه
- لا يمكن تكرار البلاغ على نفس العنصر

### 3. سجلات التدقيق
- يتم تسجيل جميع إجراءات الإدارة
- تتبع من قام بحظر المستخدم ومتى
- تسجيل مراجعات البلاغات

---

## الاستخدام

### للمستخدمين العاديين
1. تسجيل الدخول إلى الحساب
2. يمكن الإبلاغ عن المحتوى المخالف من خلال زر "إبلاغ"
3. متابعة حالة البلاغات من `/reports/my-reports`

### للمشرفين
1. تسجيل الدخول بحساب مشرف
2. الوصول إلى لوحة التحكم من القائمة العلوية
3. مراجعة البلاغات المعلقة
4. اتخاذ الإجراءات المناسبة

### للمديرين
1. جميع صلاحيات المشرفين
2. إدارة المستخدمين (حظر، إلغاء حظر)
3. عرض الإحصائيات والتحليلات

### للمديرين الأعلى
1. جميع الصلاحيات السابقة
2. تعيين المشرفين والمديرين
3. تعديل صلاحيات المستخدمين
4. حذف المستخدمين نهائياً

---

## التطوير المستقبلي

### ميزات مقترحة
- [ ] سجل نشاطات الإدارة (Activity Log)
- [ ] نظام التحذيرات قبل الحظر
- [ ] إحصائيات متقدمة ورسوم بيانية
- [ ] نظام الطعون على الحظر
- [ ] إشعارات للمشرفين عند البلاغات الجديدة
- [ ] فلترة المحتوى التلقائية (AI)
- [ ] نظام النقاط للمستخدمين
- [ ] تقارير دورية للمشرفين

---

## الخاتمة

نظام الإدارة في HiveLog يوفر:
✅ تحكم كامل في الأدوار والصلاحيات
✅ نظام بلاغات شامل
✅ واجهة إدارية سهلة الاستخدام
✅ أمان محكم للبيانات
✅ قابلية التوسع والتطوير

للمزيد من المعلومات، راجع الكود المصدري أو اتصل بالفريق التقني.
