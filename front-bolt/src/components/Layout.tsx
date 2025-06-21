import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LogOut, 
  User, 
  Briefcase, 
  Calendar, 
  BarChart3, 
  Settings,
  Home,
  Users,
  MessageSquare
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const candidateNavItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/jobs', icon: Briefcase, label: 'Jobs' },
    { path: '/interviews', icon: Calendar, label: 'Interviews' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const adminNavItems = [
    { path: '/admin', icon: Home, label: 'Dashboard' },
    { path: '/admin/jobs', icon: Briefcase, label: 'Manage Jobs' },
    { path: '/admin/candidates', icon: Users, label: 'Candidates' },
    { path: '/admin/interviews', icon: MessageSquare, label: 'Interviews' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : candidateNavItems;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Navigation Sidebar */}
      <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-6 bg-gradient-to-r from-blue-600 to-purple-600">
            <Link to="/" className="text-white text-xl font-bold">
              Bolt.new
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'}`} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Logout Button */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pl-64">
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};