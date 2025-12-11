import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  MessageSquare, 
  BookOpen, 
  Clock,
  Tag 
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentStage = params.get('stage');
  const currentSort = params.get('sort');

  const NavLink = ({ to, icon: Icon, label, active }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        active
          ? 'bg-primary-50 text-primary-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  const categories = [
    { name: 'سؤال', color: 'bg-blue-500' },
    { name: 'نقاش', color: 'bg-purple-500' },
    { name: 'فكرة', color: 'bg-yellow-500' },
    { name: 'تجربة', color: 'bg-green-500' },
    { name: 'طلب مساعدة', color: 'bg-red-500' },
    { name: 'عام', color: 'bg-gray-500' },
  ];

  return (
    <div className="space-y-6 sticky top-20">
      {/* Main Navigation */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          التصفح
        </h3>
        <nav className="space-y-1">
          <NavLink
            to="/"
            icon={Home}
            label="الرئيسية"
            active={!currentSort && !currentStage}
          />
          <NavLink
            to="/?sort=trending"
            icon={TrendingUp}
            label="الشائع"
            active={currentSort === 'trending'}
          />
          <NavLink
            to="/?sort=recent"
            icon={Clock}
            label="الأحدث"
            active={currentSort === 'recent'}
          />
          <NavLink
            to="/?sort=discussed"
            icon={MessageSquare}
            label="الأكثر نقاشاً"
            active={currentSort === 'discussed'}
          />
        </nav>
      </div>

      {/* Stage Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          المراحل
        </h3>
        <nav className="space-y-1">
          <NavLink
            to="/?stage=sandbox"
            icon={MessageSquare}
            label="نقاش نشط"
            active={currentStage === 'sandbox'}
          />
          <NavLink
            to="/?stage=wiki"
            icon={BookOpen}
            label="ويكي متجدد"
            active={currentStage === 'wiki'}
          />
        </nav>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          الفئات
        </h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.name}
              to={`/?category=${encodeURIComponent(category.name)}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className={`w-3 h-3 rounded-full ${category.color}`}></div>
              <span className="text-sm text-gray-700">{category.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg p-6 text-white">
        <h3 className="text-lg font-bold mb-2">كيف يعمل HiveLog؟</h3>
        <p className="text-sm text-primary-100 mb-4">
          نقاشاتك تتحول تلقائياً إلى معرفة منظمة بعد 30 يوماً
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>ناقش بحرية</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>الذكاء الاصطناعي يلخص</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>معرفة منظمة للأبد</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
