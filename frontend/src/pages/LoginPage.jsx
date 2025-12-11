import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'react-query';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';
import toast from 'react-hot-toast';
import { LogIn, Mail, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation(
    async (credentials) => {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setAuth(data.user, data.token);
        toast.success('تم تسجيل الدخول بنجاح');
        navigate('/');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
      },
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            تسجيل الدخول
          </h1>
          <p className="text-gray-600">
            مرحباً بك في HiveLog
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            disabled={loginMutation.isLoading}
            className="w-full btn btn-primary py-3 text-lg"
          >
            {loginMutation.isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 spinner"></div>
                جاري التسجيل...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-primary-600 font-medium hover:underline">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
