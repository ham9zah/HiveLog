const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken' 
      });
    }
    
    // Create user
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        karma: user.karma
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    
    // Update last seen
    user.lastSeen = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        karma: user.karma,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
});

/**
 * Get current user
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get user data' });
  }
});

/**
 * Update user profile
 */
router.patch('/me', authenticate, async (req, res) => {
  try {
    const { bio, avatar } = req.body;
    
    if (bio !== undefined) {
      req.user.bio = bio;
    }
    
    if (avatar !== undefined) {
      req.user.avatar = avatar;
    }
    
    await req.user.save();
    
    res.json({ 
      message: 'Profile updated successfully',
      user: req.user 
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

/**
 * Create first super admin (for setup only)
 * يمكن استخدامه مرة واحدة فقط لإنشاء أول مدير
 */
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password, secretKey } = req.body;
    
    // Secret key للحماية - يجب أن يكون في .env
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid secret key' });
    }
    
    // التحقق من عدم وجود admin
    const existingAdmin = await User.findOne({ 
      role: { $in: ['super_admin', 'admin'] } 
    });
    
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin already exists. Use admin panel to create more.' 
      });
    }
    
    // إنشاء super admin
    const admin = new User({
      username,
      email,
      password,
      role: 'super_admin',
      permissions: [
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
    });
    
    await admin.save();
    
    const token = jwt.sign(
      { userId: admin._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Super admin created successfully',
      token,
      user: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ message: 'Failed to create admin' });
  }
});

module.exports = router;
