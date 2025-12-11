import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const registerMutation = useMutation(
    async (data) => {
      const response = await api.post('/auth/register', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setAuth(data.user, data.token);
        toast.success('تم إنشاء الحساب بنجاح');
        navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل إنشاء الحساب');
      },
    }
  );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    const { confirmPassword, ...data } = formData;
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-gray-600">
            انضم إلى مجتمع HiveLog
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="input pr-10"
                placeholder="username"
                required
                minLength={3}
                maxLength={30}
              />
              <User className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input pr-10"
                placeholder="example@email.com"
                required
              />
              <Mail className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input pr-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <Lock className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              تأكيد كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input pr-10"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <Lock className="absolute right-3 top-3 text-gray-400" size={20} />
            </div>
          </div>

          <button
            type="submit"
            disabled={registerMutation.isLoading}
            className="w-full btn btn-primary py-3 text-lg"
          >
            {registerMutation.isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 spinner"></div>
                جاري الإنشاء...
              </span>
            ) : (
              'إنشاء حساب'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
