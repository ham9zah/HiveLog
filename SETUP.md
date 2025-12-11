# دليل الإعداد والتشغيل - HiveLog

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:
- **Node.js** (الإصدار 18 أو أحدث)
- **MongoDB** (الإصدار 6 أو أحدث)
- **npm** أو **yarn**

## خطوات الإعداد

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd HiveLog
```

### 2. تثبيت المكتبات الأساسية

```bash
npm run install:all
```

أو قم بالتثبيت يدوياً:

```bash
# تثبيت مكتبات Backend
cd backend
npm install

# تثبيت مكتبات Frontend
cd ../frontend
npm install
```

### 3. إعداد قاعدة البيانات MongoDB

#### تثبيت MongoDB على macOS:
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

#### التحقق من تشغيل MongoDB:
```bash
mongosh
# إذا اتصلت بنجاح، اكتب exit للخروج
```

### 4. إعداد متغيرات البيئة

#### Backend:
```bash
cd backend
cp .env.example .env
```

افتح ملف `.env` وقم بتعديل المتغيرات:

```env
NODE_ENV=development
PORT=5000

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/hivelog

# JWT Secret (غيّره إلى قيمة عشوائية قوية)
JWT_SECRET=your-super-secret-jwt-key-change-this

# OpenAI API Key (احصل عليه من https://platform.openai.com)
OPENAI_API_KEY=sk-your-api-key-here

# Frontend URL
FRONTEND_URL=http://localhost:3000

# AI Processing Settings
AI_SYNTHESIS_DELAY_DAYS=30
MIN_INTERACTION_THRESHOLD=50
```

#### Frontend:
```bash
cd frontend
```

أنشئ ملف `.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 5. الحصول على OpenAI API Key

1. اذهب إلى: https://platform.openai.com/
2. سجّل حساباً أو سجّل دخول
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. انسخ المفتاح وضعه في ملف `.env` الخاص بالـ Backend

## تشغيل المشروع

### طريقة 1: تشغيل كل شيء معاً (موصى بها)

من المجلد الرئيسي:
```bash
npm run dev
```

هذا الأمر سيشغل Backend و Frontend معاً.

### طريقة 2: تشغيل كل جزء بشكل منفصل

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

سيعمل Backend على: http://localhost:5000

#### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

سيعمل Frontend على: http://localhost:3000

## التحقق من التشغيل

1. افتح المتصفح على: http://localhost:3000
2. يجب أن ترى الصفحة الرئيسية لـ HiveLog
3. تحقق من Backend بزيارة: http://localhost:5000/api/health

## إنشاء أول حساب مستخدم

1. اذهب إلى: http://localhost:3000/register
2. أدخل:
   - اسم المستخدم
   - البريد الإلكتروني
   - كلمة المرور
3. اضغط "إنشاء حساب"
4. سيتم تسجيل دخولك تلقائياً

## إنشاء أول منشور

1. اضغط على "منشور جديد" في الشريط العلوي
2. اختر الفئة
3. أدخل العنوان والمحتوى
4. اضغط "نشر المنشور"

## اختبار نظام التحويل الذكي

### تشغيل يدوي (للاختبار السريع):

يمكنك تشغيل التحويل يدوياً باستخدام API:

```bash
# احصل على Post ID من المنشور الذي تريد تحويله
POST_ID="your-post-id"
TOKEN="your-jwt-token"

curl -X POST http://localhost:5000/api/wiki/generate/$POST_ID \
  -H "Authorization: Bearer $TOKEN"
```

### تشغيل تلقائي:

النظام يفحص المنشورات كل ساعة ويحول المنشورات التي:
- مر عليها 30 يوماً، أو
- وصلت لحد التفاعل المطلوب (50 نقطة)

## الأوامر المفيدة

### Backend:
```bash
# تشغيل وضع التطوير
npm run dev

# تشغيل وضع الإنتاج
npm start

# تشغيل الاختبارات
npm test
```

### Frontend:
```bash
# تشغيل وضع التطوير
npm run dev

# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview
```

## حل المشاكل الشائعة

### خطأ: Cannot connect to MongoDB

**الحل:**
```bash
# تأكد من تشغيل MongoDB
brew services start mongodb-community@7.0

# تحقق من الاتصال
mongosh
```

### خطأ: Port 5000 already in use

**الحل:**
```bash
# اقتل العملية التي تستخدم المنفذ
lsof -ti:5000 | xargs kill -9

# أو غيّر المنفذ في .env
PORT=5001
```

### خطأ: OpenAI API rate limit

**الحل:**
- تأكد من أن لديك رصيد كافٍ في حساب OpenAI
- قلل عدد الطلبات للـ API
- غيّر `MIN_INTERACTION_THRESHOLD` لقيمة أعلى في `.env`

### خطأ: Cannot find module

**الحل:**
```bash
# احذف node_modules وأعد التثبيت
rm -rf node_modules package-lock.json
npm install
```

## البنية الأساسية للمشروع

```
HiveLog/
├── backend/              # خادم Node.js
│   ├── models/          # نماذج MongoDB
│   ├── routes/          # مسارات API
│   ├── services/        # خدمات الذكاء الاصطناعي
│   ├── middleware/      # وسيطات المصادقة
│   └── server.js        # نقطة البداية
│
├── frontend/            # تطبيق React
│   ├── src/
│   │   ├── components/ # مكونات UI
│   │   ├── pages/      # صفحات التطبيق
│   │   ├── services/   # خدمات API
│   │   └── stores/     # إدارة الحالة
│   └── package.json
│
└── README.md
```

## الخطوات التالية

1. **إضافة تعليقات متشعبة**: نظام التعليقات جاهز في Backend، يحتاج فقط لمكونات Frontend
2. **تحسين UI/UX**: إضافة رسوم متحركة وتحسينات بصرية
3. **نظام الإشعارات**: استخدام Socket.io للإشعارات الفورية
4. **رفع الملفات**: إضافة دعم رفع الصور والملفات
5. **البحث المتقدم**: إضافة فلاتر وبحث متقدم

## الدعم

إذا واجهت أي مشكلة:
1. راجع هذا الدليل
2. تحقق من logs في Terminal
3. راجع ملفات `.env`
4. تأكد من تشغيل MongoDB

---

**تم بناء المشروع بـ ❤️ باستخدام:**
- Node.js & Express
- React & Tailwind CSS
- MongoDB
- OpenAI GPT-4
- Socket.io
