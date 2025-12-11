import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Ban, 
  CheckCircle, 
  Trash2, 
  Shield,
  Settings
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showActions, setShowActions] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (!currentUser || (!currentUser.role || (currentUser.role !== 'admin' && currentUser.role !== 'super_admin'))) {
      navigate('/');
      return;
    }

    fetchUsers();
  }, [currentUser, navigate, search, roleFilter, pagination.page]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter })
      });

      const response = await fetch(`http://localhost:5000/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('فشل تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (currentUser.role !== 'super_admin') {
      toast.error('هذا الإجراء يتطلب صلاحيات مدير أعلى');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        toast.success('تم تحديث دور المستخدم بنجاح');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل تحديث دور المستخدم');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('حدث خطأ أثناء تحديث الدور');
    }
  };

  const handleBanUser = async (userId) => {
    const reason = prompt('أدخل سبب الحظر:');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        toast.success('تم حظر المستخدم بنجاح');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل حظر المستخدم');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('حدث خطأ أثناء الحظر');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('تم إلغاء حظر المستخدم بنجاح');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل إلغاء الحظر');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast.error('حدث خطأ أثناء إلغاء الحظر');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ سيتم حذف جميع محتوياته.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('تم حذف المستخدم بنجاح');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل حذف المستخدم');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  const getRoleBadge = (role) => {
    const roles = {
      user: { label: 'مستخدم', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
      moderator: { label: 'مشرف', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      admin: { label: 'مدير', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' },
      super_admin: { label: 'مدير أعلى', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' }
    };
    return roles[role] || roles.user;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة المستخدمين
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {pagination.total.toLocaleString('ar')} مستخدم
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن مستخدم..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">جميع الأدوار</option>
              <option value="user">مستخدم</option>
              <option value="moderator">مشرف</option>
              <option value="admin">مدير</option>
              <option value="super_admin">مدير أعلى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  المستخدم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  البريد الإلكتروني
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  الدور
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  تاريخ التسجيل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                return (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-gray-900 font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                        <div className="mr-3">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.isBanned ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          محظور
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          نشط
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(user.createdAt).toLocaleDateString('ar')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="relative">
                        <button
                          onClick={() => setShowActions(showActions === user._id ? null : user._id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        
                        {showActions === user._id && (
                          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-600">
                            {currentUser.role === 'super_admin' && (
                              <button
                                onClick={() => navigate(`/admin/users/${user._id}/permissions`)}
                                className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2"
                              >
                                <Settings className="w-4 h-4" />
                                الصلاحيات
                              </button>
                            )}
                            
                            {user.isBanned ? (
                              <button
                                onClick={() => handleUnbanUser(user._id)}
                                className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-green-600"
                              >
                                <CheckCircle className="w-4 h-4" />
                                إلغاء الحظر
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBanUser(user._id)}
                                className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-yellow-600"
                              >
                                <Ban className="w-4 h-4" />
                                حظر المستخدم
                              </button>
                            )}
                            
                            {currentUser.role === 'super_admin' && (
                              <button
                                onClick={() => handleDeleteUser(user._id)}
                                className="w-full px-4 py-2 text-right hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                حذف المستخدم
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
