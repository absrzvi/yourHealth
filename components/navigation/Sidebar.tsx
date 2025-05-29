import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  MessageSquare, 
  LayoutDashboard, 
  FileText, 
  Upload, 
  Link2, 
  TrendingUp, 
  User, 
  Settings, 
  LogOut,
  Shield 
} from 'lucide-react';

const menuItems = [
  { icon: MessageSquare, label: 'Aria Chat', href: '/', active: true },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Upload, label: 'Data Sources', href: '/data-sources' },
  { icon: Link2, label: 'Correlations', href: '/correlations' },
  { icon: TrendingUp, label: 'Insights', href: '/insights' },
  { icon: User, label: 'Profile', href: '/profile' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: LogOut, label: 'Logout', action: 'logout' }
];

const Sidebar = () => {
  const pathname = usePathname();
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/login' });
  };
  
  return (
    <aside className="fixed inset-y-0 left-0 bg-gray-800 w-60 z-20 flex flex-col shadow-lg transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen">
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <Link href="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full" style={{ background: 'var(--aria-gradient)' }}></div>
          <span className="text-white font-semibold text-lg">For Your Health</span>
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item, index) => {
            const isActive = item.href === pathname;
            const ItemIcon = item.icon;
            
            if (item.action === 'logout') {
              return (
                <li key={index}>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center w-full p-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors group"
                    aria-label="Logout"
                  >
                    <ItemIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            }
            
            return (
              <li key={index}>
                <Link 
                  href={item.href}
                  className={`flex items-center p-3 rounded-md transition-colors group ${
                    isActive 
                      ? 'text-white' 
                      : 'text-gray-300 hover:bg-gray-700'
                  }`}
                  style={isActive ? { background: 'var(--aria-gradient)' } : {}}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <ItemIcon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                  {item.label === 'Aria Chat' && (
                    <span className="ml-auto bg-blue-600 text-xs rounded-full px-2 py-1 flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      HIPAA
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">User Name</p>
            <p className="text-xs text-gray-400">user@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
