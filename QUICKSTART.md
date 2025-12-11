# 🚀 Quick Start - البدء السريع

## التثبيت في 5 دقائق

### 1. المتطلبات
```bash
# تحقق من النسخ المطلوبة
node --version  # v18+
mongod --version # v6+
```

### 2. التثبيت
```bash
# استنسخ المشروع
git clone <repo-url>
cd HiveLog

# ثبت المكتبات
npm run install:all
```

### 3. الإعداد
```bash
# Backend
cd backend
cp .env.example .env
# عدّل .env وأضف OPENAI_API_KEY

# Frontend
cd ../frontend
cp .env.example .env
```

### 4. التشغيل
```bash
# من المجلد الرئيسي
npm run dev
```

### 5. الوصول
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## أول خطوات

1. **سجّل حساب:** http://localhost:3000/register
2. **أنشئ منشور:** اضغط "منشور جديد"
3. **اكتب محتوى:** عنوان + محتوى + فئة
4. **انشر:** سيظهر في الصفحة الرئيسية

## اختبار AI

للاختبار السريع، يمكنك تحويل منشور يدوياً:

```bash
# احصل على المنشور ID من المتصفح
# مثال: /post/abc123 → abc123

# سجل دخول واحصل على token من DevTools
# Application → Local Storage → token

# نفذ الأمر:
curl -X POST http://localhost:5000/api/wiki/generate/POST_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## مشاكل شائعة

### MongoDB لا يعمل
```bash
brew services start mongodb-community@7.0
```

### المنفذ مستخدم
```bash
# غيّر PORT في backend/.env
PORT=5001
```

### OpenAI API خطأ
تأكد من:
- المفتاح صحيح في `.env`
- لديك رصيد في حساب OpenAI

---

للمزيد: راجع [SETUP.md](SETUP.md)
