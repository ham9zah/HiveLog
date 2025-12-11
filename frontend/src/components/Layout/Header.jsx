import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Search, User, LogOut, PlusCircle } from 'lucide-react';
import { useState } from 'react';
import ThemeToggle from '../ThemeToggle/ThemeToggle';
import NotificationCenter from '../Notification/NotificationCenter';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm sticky top-0 z-50 transition-colors">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">HiveLog</span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="ابحث عن نقاش..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {isAuthenticated() ? (
              <>
                <Link
                  to="/create"
                  className="btn btn-primary flex items-center gap-2"
                >
                  <PlusCircle size={18} />
                  <span className="hidden sm:inline">منشور جديد</span>
                </Link>

                <NotificationCenter />

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-primary-600" />
                      </div>
                    )}
                    <span className="hidden md:inline text-sm font-medium">
                      {user?.username}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                      <Link
                        to={`/user/${user?.username}`}
                        className="block px-4 py-2 text-sm hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={16} className="inline ml-2" />
                        الملف الشخصي
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={16} className="inline ml-2" />
                        تسجيل الخروج
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn btn-primary">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
