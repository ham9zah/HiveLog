import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  FileText,
  MessageSquare
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function ReportsManagement() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedReport, setSelectedReport] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    if (!user || !user.permissions?.includes('view_reports')) {
      navigate('/');
      return;
    }

    fetchReports();
  }, [user, navigate, statusFilter, typeFilter, pagination.page]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { targetType: typeFilter })
      });

      const response = await fetch(`http://localhost:5000/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('فشل تحميل البلاغات');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (reportId) => {
    const action = prompt('اختر الإجراء:\n1. none - لا شيء\n2. warning - تحذير\n3. content_removed - حذف المحتوى\n4. user_banned - حظر المستخدم\n5. user_suspended - تعليق المستخدم');
    const reviewNotes = prompt('أدخل ملاحظات المراجعة:');

    if (!action || !reviewNotes) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, reviewNotes })
      });

      if (response.ok) {
        toast.success('تم حل البلاغ بنجاح');
        fetchReports();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل حل البلاغ');
      }
    } catch (error) {
      console.error('Error resolving report:', error);
      toast.error('حدث خطأ أثناء حل البلاغ');
    }
  };

  const handleDismiss = async (reportId) => {
    const reviewNotes = prompt('أدخل سبب الرفض:');
    if (!reviewNotes) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/reports/${reportId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reviewNotes })
      });

      if (response.ok) {
        toast.success('تم رفض البلاغ');
        fetchReports();
      } else {
        const data = await response.json();
        toast.error(data.message || 'فشل رفض البلاغ');
      }
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('حدث خطأ أثناء رفض البلاغ');
    }
  };

  const getStatusBadge = (status) => {
    const statuses = {
      pending: { label: 'معلق', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock },
      reviewing: { label: 'قيد المراجعة', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Eye },
      resolved: { label: 'تم الحل', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      dismissed: { label: 'مرفوض', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: XCircle }
    };
    return statuses[status] || statuses.pending;
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      spam: 'رسائل مزعجة',
      harassment: 'مضايقة',
      hate_speech: 'خطاب كراهية',
      misinformation: 'معلومات مضللة',
      inappropriate: 'محتوى غير لائق',
      copyright: 'انتهاك حقوق الطبع',
      violence: 'عنف',
      other: 'أخرى'
    };
    return reasons[reason] || reason;
  };

  const getTargetIcon = (type) => {
    const icons = {
      post: FileText,
      comment: MessageSquare,
      user: User
    };
    return icons[type] || FileText;
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
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              إدارة البلاغات
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {pagination.total.toLocaleString('ar')} بلاغ
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="pending">معلقة</option>
              <option value="reviewing">قيد المراجعة</option>
              <option value="resolved">محلولة</option>
              <option value="dismissed">مرفوضة</option>
            </select>
          </div>

          <div className="relative">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">جميع الأنواع</option>
              <option value="post">منشور</option>
              <option value="comment">تعليق</option>
              <option value="user">مستخدم</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {reports.map((report) => {
          const statusBadge = getStatusBadge(report.status);
          const TargetIcon = getTargetIcon(report.targetType);
          const StatusIcon = statusBadge.icon;

          return (
            <div
              key={report._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <TargetIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {getReasonLabel(report.reason)}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${statusBadge.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusBadge.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {report.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>بواسطة: {report.reporter?.username}</span>
                      <span>•</span>
                      <span>{new Date(report.createdAt).toLocaleDateString('ar')}</span>
                      {report.reviewedBy && (
                        <>
                          <span>•</span>
                          <span>راجعه: {report.reviewedBy.username}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {report.reviewNotes && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">ملاحظات المراجعة:</span> {report.reviewNotes}
                  </p>
                </div>
              )}

              {report.status === 'pending' && user.permissions?.includes('manage_reports') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResolve(report._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    حل البلاغ
                  </button>
                  <button
                    onClick={() => handleDismiss(report._id)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    رفض البلاغ
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {reports.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">لا توجد بلاغات</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
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
  );
}
