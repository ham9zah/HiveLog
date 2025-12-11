import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  Shield, 
  TrendingUp,
  UserX,
  Activity
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من الصلاحيات
    if (!user || (!user.role || (user.role !== 'admin' && user.role !== 'super_admin'))) {
      navigate('/');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          فشل تحميل الإحصائيات
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي المستخدمين',
      value: stats.overview.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users'
    },
    {
      title: 'المنشورات',
      value: stats.overview.totalPosts,
      icon: FileText,
      color: 'bg-green-500',
      link: '/admin/content'
    },
    {
      title: 'التعليقات',
      value: stats.overview.totalComments,
      icon: MessageSquare,
      color: 'bg-purple-500',
      link: '/admin/content'
    },
    {
      title: 'المستخدمون النشطون',
      value: stats.overview.activeUsers,
      icon: Activity,
      color: 'bg-cyan-500',
      link: '/admin/users'
    },
    {
      title: 'البلاغات المعلقة',
      value: stats.overview.pendingReports,
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      link: '/admin/reports'
    },
    {
      title: 'المستخدمون المحظورون',
      value: stats.overview.bannedUsers,
      icon: UserX,
      color: 'bg-red-500',
      link: '/admin/users?filter=banned'
    }
  ];

  const growthCards = [
    {
      title: 'مستخدمون جدد (7 أيام)',
      value: stats.growth.newUsers,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'منشورات جديدة (7 أيام)',
      value: stats.growth.newPosts,
      icon: FileText,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'تعليقات جديدة (7 أيام)',
      value: stats.growth.newComments,
      icon: MessageSquare,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            لوحة التحكم الإدارية
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          نظرة عامة على إحصائيات المنصة والنشاط
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            onClick={() => navigate(stat.link)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString('ar')}
                </p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Growth Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            إحصائيات النمو
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {growthCards.map((stat, index) => (
            <div key={index} className="border-r border-gray-200 dark:border-gray-700 last:border-r-0 pr-6 last:pr-0">
              <div className="flex items-center gap-3 mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {stat.title}
                </p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stat.value.toLocaleString('ar')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          إجراءات سريعة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors text-right"
          >
            <Users className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white">إدارة المستخدمين</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">عرض وتعديل المستخدمين</p>
          </button>

          <button
            onClick={() => navigate('/admin/content')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors text-right"
          >
            <FileText className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white">إدارة المحتوى</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">مراجعة المنشورات والتعليقات</p>
          </button>

          <button
            onClick={() => navigate('/admin/reports')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors text-right"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white">البلاغات</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">مراجعة البلاغات المعلقة</p>
          </button>

          <button
            onClick={() => navigate('/admin/permissions')}
            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-500 transition-colors text-right"
          >
            <Shield className="w-6 h-6 text-yellow-500 mb-2" />
            <p className="font-semibold text-gray-900 dark:text-white">الصلاحيات</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">إدارة أدوار الوصول</p>
          </button>
        </div>
      </div>
    </div>
  );
}
