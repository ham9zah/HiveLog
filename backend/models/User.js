const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  karma: {
    type: Number,
    default: 0
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'super_admin'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',        // إدارة المستخدمين
      'ban_users',           // حظر المستخدمين
      'delete_posts',        // حذف المنشورات
      'delete_comments',     // حذف التعليقات
      'edit_posts',          // تعديل المنشورات
      'pin_posts',           // تثبيت المنشورات
      'manage_categories',   // إدارة الفئات
      'view_reports',        // عرض البلاغات
      'manage_reports',      // إدارة البلاغات
      'view_analytics',      // عرض الإحصائيات
      'manage_permissions',  // إدارة الصلاحيات
      'manage_moderators'    // إدارة المشرفين
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: {
    type: String,
    default: null
  },
  bannedAt: {
    type: Date,
    default: null
  },
  bannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Check if user has permission
userSchema.methods.hasPermission = function(permission) {
  if (this.role === 'super_admin') return true;
  if (this.role === 'admin') {
    const adminPermissions = ['manage_users', 'ban_users', 'delete_posts', 'delete_comments', 
                              'edit_posts', 'pin_posts', 'view_reports', 'manage_reports', 'view_analytics'];
    return adminPermissions.includes(permission);
  }
  return this.permissions.includes(permission);
};

// Check if user is admin or super admin
userSchema.methods.isAdminRole = function() {
  return ['admin', 'super_admin'].includes(this.role);
};

// Check if user is moderator or higher
userSchema.methods.isModeratorRole = function() {
  return ['moderator', 'admin', 'super_admin'].includes(this.role);
};

module.exports = mongoose.model('User', userSchema);
