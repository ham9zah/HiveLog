import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import useNotificationStore from './stores/notificationStore';
import socketService from './services/socket';
import toast from 'react-hot-toast';

// Layout
import Layout from './components/Layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import PostPage from './pages/PostPage';
import CreatePostPage from './pages/CreatePostPage';
import WikiPage from './pages/WikiPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import ReportsManagement from './pages/ReportsManagement';
import CreateAdmin from './pages/CreateAdmin';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/login" />;
};

function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Force dark mode
    document.documentElement.classList.add('dark');
    
    // Connect socket if authenticated
    if (isAuthenticated()) {
      socketService.connect();
      
      // الاستماع للإشعارات الفورية
      const socket = socketService.socket;
      if (socket && user) {
        // الانضمام لغرفة المستخدم
        socket.emit('join-user', user._id);
        
        // استقبال إشعار جديد
        socket.on('new-notification', (notification) => {
          addNotification(notification);
          // عرض toast notification
          toast(
            <div className="flex items-center gap-2">
              <span className="font-medium">{notification.sender.username}</span>
              <span>{notification.message}</span>
            </div>,
            {
              duration: 4000,
              icon: '🔔',
            }
          );
        });
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user, addNotification]);

  return (
    <Routes>
      {/* Admin Setup Route - Standalone */}
      <Route path="create-admin" element={<CreateAdmin />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="post/:id" element={<PostPage />} />
        <Route path="wiki/:postId" element={<WikiPage />} />
        <Route path="user/:username" element={<ProfilePage />} />
        
        {/* Protected Routes */}
        <Route
          path="create"
          element={
            <ProtectedRoute>
              <CreatePostPage />
            </ProtectedRoute>
          }
        />
        
        {/* Admin Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute>
              <ReportsManagement />
            </ProtectedRoute>
          }
        />
        
        {/* Auth Routes */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        
        {/* 404 */}
        <Route path="*" element={<div className="text-center py-20">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-gray-600 mt-2">الصفحة غير موجودة</p>
        </div>} />
      </Route>
    </Routes>
  );
}

export default App;
