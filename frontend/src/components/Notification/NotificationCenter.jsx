import { useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  Bell, 
  X, 
  Check, 
  Trash2,
  MessageCircle,
  ThumbsUp,
  BookOpen,
  User,
  Loader
} from 'lucide-react';

const NotificationCenter = () => {
  const { isAuthenticated } = useAuthStore();
  const { 
    notifications, 
    unreadCount, 
    isOpen, 
    setNotifications, 
    setUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleOpen,
    setOpen
  } = useNotificationStore();
  
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // جلب الإشعارات
  const { isLoading } = useQuery(
    ['notifications'],
    async () => {
      const response = await api.get('/notifications');
      return response.data;
    },
    {
      enabled: isAuthenticated(),
      onSuccess: (data) => {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      },
      refetchInterval: 30000, // تحديث كل 30 ثانية
    }
  );

  // وضع علامة مقروء
  const markAsReadMutation = useMutation(
    async (notificationId) => {
      await api.put(`/notifications/${notificationId}/read`);
    },
    {
      onSuccess: (_, notificationId) => {
        markAsRead(notificationId);
      },
    }
  );

  // وضع علامة مقروء على الكل
  const markAllAsReadMutation = useMutation(
    async () => {
      await api.put('/notifications/read-all');
    },
    {
      onSuccess: () => {
        markAllAsRead();
        toast.success('تم وضع علامة مقروء على جميع الإشعارات');
      },
    }
  );

  // حذف إشعار
  const deleteMutation = useMutation(
    async (notificationId) => {
      await api.delete(`/notifications/${notificationId}`);
    },
    {
      onSuccess: (_, notificationId) => {
        removeNotification(notificationId);
        toast.success('تم حذف الإشعار');
      },
    }
  );

  // حذف كل الإشعارات
  const deleteAllMutation = useMutation(
    async () => {
      await api.delete('/notifications');
    },
    {
      onSuccess: () => {
        clearAll();
        toast.success('تم حذف جميع الإشعارات');
      },
    }
  );

  // إغلاق عند النقر خارج القائمة
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setOpen]);

  // أيقونة حسب نوع الإشعار
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageCircle size={20} className="text-blue-500" />;
      case 'vote':
        return <ThumbsUp size={20} className="text-green-500" />;
      case 'wiki_ready':
      case 'post_transition':
        return <BookOpen size={20} className="text-purple-500" />;
      case 'follow':
        return <User size={20} className="text-primary-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsReadMutation.mutate(notification._id);
    }
    setOpen(false);
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* زر الإشعارات */}
      <button
        onClick={toggleOpen}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* قائمة الإشعارات */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[600px] flex flex-col">
          {/* الهيدر */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                الإشعارات
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* أزرار الإجراءات */}
            {notifications.length > 0 && (
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => markAllAsReadMutation.mutate()}
                  disabled={markAllAsReadMutation.isLoading || unreadCount === 0}
                  className="text-primary-600 hover:text-primary-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Check size={14} />
                  قراءة الكل
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من حذف جميع الإشعارات؟')) {
                      deleteAllMutation.mutate();
                    }
                  }}
                  disabled={deleteAllMutation.isLoading}
                  className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  حذف الكل
                </button>
              </div>
            )}
          </div>

          {/* قائمة الإشعارات */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="animate-spin text-primary-600" size={32} />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Bell className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={48} />
                <p className="text-gray-500 dark:text-gray-400">
                  لا توجد إشعارات
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <Link
                    key={notification._id}
                    to={notification.link}
                    onClick={() => handleNotificationClick(notification)}
                    className={`block p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* الأيقونة */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* المحتوى */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-medium">
                              {notification.sender.username}
                            </span>{' '}
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: ar,
                          })}
                        </p>
                      </div>

                      {/* زر الحذف */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteMutation.mutate(notification._id);
                        }}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
