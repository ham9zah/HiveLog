# توثيق API - HiveLog

## جدول المحتويات
- [المصادقة](#المصادقة)
- [المنشورات](#المنشورات)
- [التعليقات](#التعليقات)
- [الويكي](#الويكي)
- [المستخدمين](#المستخدمين)

---

## المصادقة

### تسجيل مستخدم جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123"
}
```

**الرد:**
```json
{
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "username": "user123",
    "email": "user@example.com",
    "karma": 0
  }
}
```

### تسجيل الدخول
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### الحصول على المستخدم الحالي
```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

## المنشورات

### الحصول على جميع المنشورات
```http
GET /api/posts?stage=sandbox&category=نقاش&sort=trending&page=1&limit=20
```

**المعاملات:**
- `stage`: sandbox | processing | wiki
- `category`: سؤال | نقاش | فكرة | تجربة | طلب مساعدة | عام
- `sort`: recent | popular | trending | discussed
- `search`: نص البحث
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد النتائج (افتراضي: 20)

**الرد:**
```json
{
  "posts": [
    {
      "_id": "post-id",
      "title": "عنوان المنشور",
      "content": "محتوى المنشور",
      "author": {
        "username": "user123",
        "avatar": "avatar-url"
      },
      "category": "نقاش",
      "stage": "sandbox",
      "voteScore": 42,
      "commentCount": 15,
      "viewCount": 234,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 5
  }
}
```

### الحصول على منشور واحد
```http
GET /api/posts/:id
```

### إنشاء منشور جديد
```http
POST /api/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "عنوان المنشور",
  "content": "محتوى المنشور المفصل",
  "category": "نقاش",
  "tags": ["تقنية", "برمجة"],
  "attachments": [
    {
      "type": "image",
      "url": "image-url",
      "name": "screenshot.png"
    }
  ]
}
```

### التصويت على منشور
```http
POST /api/posts/:id/vote
Authorization: Bearer {token}
Content-Type: application/json

{
  "voteType": "up" // up | down | remove
}
```

### تعديل منشور
```http
PATCH /api/posts/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "عنوان محدث",
  "content": "محتوى محدث",
  "tags": ["تحديث", "جديد"]
}
```

### حذف منشور
```http
DELETE /api/posts/:id
Authorization: Bearer {token}
```

---

## التعليقات

### الحصول على تعليقات منشور
```http
GET /api/comments/post/:postId?sort=best&parentId=null
```

**المعاملات:**
- `sort`: best | recent | oldest
- `parentId`: null (للتعليقات الرئيسية) | comment-id (للردود)

### إنشاء تعليق
```http
POST /api/comments
Authorization: Bearer {token}
Content-Type: application/json

{
  "postId": "post-id",
  "content": "محتوى التعليق",
  "parentComment": null, // أو comment-id للرد على تعليق
  "attachments": []
}
```

### التصويت على تعليق
```http
POST /api/comments/:id/vote
Authorization: Bearer {token}
Content-Type: application/json

{
  "voteType": "up"
}
```

### تعديل تعليق
```http
PATCH /api/comments/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "محتوى محدث"
}
```

### حذف تعليق
```http
DELETE /api/comments/:id
Authorization: Bearer {token}
```

---

## الويكي

### الحصول على ويكي منشور
```http
GET /api/wiki/post/:postId
```

**الرد:**
```json
{
  "wiki": {
    "_id": "wiki-id",
    "post": "post-id",
    "version": 1,
    "summary": "ملخص شامل للنقاش",
    "opinions": {
      "supporting": [
        {
          "text": "رأي مؤيد",
          "strength": "strong"
        }
      ],
      "opposing": [
        {
          "text": "رأي معارض",
          "strength": "moderate"
        }
      ],
      "neutral": []
    },
    "keyPoints": [
      {
        "title": "نقطة رئيسية",
        "description": "وصف النقطة",
        "importance": "high"
      }
    ],
    "pendingQuestions": [
      {
        "question": "سؤال معلق",
        "importance": "medium"
      }
    ],
    "conclusion": "الخلاصة النهائية",
    "generatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### توليد ويكي يدوياً (للمسؤولين فقط)
```http
POST /api/wiki/generate/:postId
Authorization: Bearer {token}
```

### تحديث ويكي بناءً على تعليقات جديدة
```http
POST /api/wiki/update/:postId
Authorization: Bearer {token}
```

### التحقق من ويكي
```http
PATCH /api/wiki/:id/verify
Authorization: Bearer {token}
```

### الاعتراض على ويكي
```http
PATCH /api/wiki/:id/dispute
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "سبب الاعتراض"
}
```

---

## المستخدمين

### الحصول على ملف مستخدم
```http
GET /api/users/:username
```

**الرد:**
```json
{
  "user": {
    "username": "user123",
    "avatar": "avatar-url",
    "bio": "نبذة عن المستخدم",
    "karma": 150,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "stats": {
    "postCount": 25,
    "commentCount": 100,
    "karma": 150
  },
  "recentPosts": [...]
}
```

### الحصول على منشورات مستخدم
```http
GET /api/users/:username/posts?page=1&limit=20
```

### الحصول على تعليقات مستخدم
```http
GET /api/users/:username/comments?page=1&limit=20
```

---

## Socket.io Events

### الاتصال
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

socket.on('connect', () => {
  console.log('Connected');
});
```

### الانضمام لغرفة منشور
```javascript
socket.emit('join-post', postId);
```

### مغادرة غرفة منشور
```javascript
socket.emit('leave-post', postId);
```

### الاستماع للتعليقات الجديدة
```javascript
socket.on('new-comment', (data) => {
  console.log('New comment:', data.comment);
});
```

### الاستماع لتحديثات التصويت
```javascript
socket.on('post-vote-update', (data) => {
  console.log('Vote update:', data);
});

socket.on('comment-vote-update', (data) => {
  console.log('Comment vote:', data);
});
```

### الاستماع لتحويل المنشور
```javascript
socket.on('post-transition-started', (data) => {
  console.log('Transition started:', data.postId);
});

socket.on('post-transition-completed', (data) => {
  console.log('Wiki created:', data.wikiId);
});
```

### الاستماع لتحديثات الويكي
```javascript
socket.on('wiki-updated', (data) => {
  console.log('Wiki updated to version:', data.wikiVersion);
});
```

---

## أكواد الحالة (Status Codes)

- `200`: نجح الطلب
- `201`: تم الإنشاء بنجاح
- `400`: خطأ في البيانات المرسلة
- `401`: غير مصرح (يتطلب تسجيل دخول)
- `403`: ممنوع (ليس لديك صلاحية)
- `404`: غير موجود
- `500`: خطأ في الخادم

---

## معالجة الأخطاء

جميع الأخطاء تُرجع بالصيغة:

```json
{
  "message": "وصف الخطأ"
}
```

مثال:
```json
{
  "message": "Authentication required"
}
```

---

## التحقق من الصحة (Validation)

### المنشورات:
- `title`: 5-300 حرف (مطلوب)
- `content`: 10+ حرف (مطلوب)
- `category`: واحدة من الفئات المحددة (مطلوب)
- `tags`: مصفوفة نصوص (اختياري)

### التعليقات:
- `content`: 1-10000 حرف (مطلوب)
- `postId`: معرف صحيح (مطلوب)
- `depth`: أقصى عمق 10 مستويات

### المستخدمين:
- `username`: 3-30 حرف، حروف وأرقام فقط (مطلوب)
- `email`: بريد إلكتروني صحيح (مطلوب)
- `password`: 6+ حرف (مطلوب)

---

## معدل الطلبات (Rate Limiting)

يمكن إضافة rate limiting باستخدام `express-rate-limit` لحماية API من الاستخدام المفرط.

مثال:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100 // أقصى 100 طلب
});

app.use('/api/', limiter);
```

---

## أمثلة الاستخدام

### مثال باستخدام cURL:

```bash
# تسجيل دخول
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# الحصول على المنشورات
curl http://localhost:5000/api/posts?stage=sandbox

# إنشاء منشور
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"عنوان","content":"محتوى","category":"نقاش"}'
```

### مثال باستخدام JavaScript (Fetch):

```javascript
// تسجيل دخول
const login = async () => {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  return data.token;
};

// إنشاء منشور
const createPost = async (token) => {
  const response = await fetch('http://localhost:5000/api/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'عنوان المنشور',
      content: 'محتوى المنشور',
      category: 'نقاش',
      tags: ['تقنية']
    })
  });
  return await response.json();
};
```

---

تم إنشاء التوثيق بواسطة HiveLog Team 🚀
