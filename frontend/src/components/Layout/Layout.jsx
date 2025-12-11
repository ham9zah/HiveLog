import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <Sidebar />
          </aside>
          
          {/* Main Content */}
          <main className="lg:col-span-9">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
