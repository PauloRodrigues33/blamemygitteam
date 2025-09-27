'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  GitBranch,
  Users,
  Calendar
} from 'lucide-react';
import { StorageService } from '@/lib/storage';

const menuItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: BarChart3,
  },
  {
    href: '/repositories',
    label: 'Repositórios',
    icon: GitBranch,
  },
  // {
  //   href: '/authors',
  //   label: 'Autores',
  //   icon: Users,
  // },
  // {
  //   href: '/reports',
  //   label: 'Relatórios',
  //   icon: Calendar,
  // },
  {
    href: '/settings',
    label: 'Configurações',
    icon: Settings,
  },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    StorageService.logout();
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 bg-gray-800">
            <GitBranch className="w-8 h-8 mr-2" />
            <h1 className="text-xl font-bold">Blame My Git Team</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-300 rounded-lg hover:bg-gray-800 hover:text-white transition-colors duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}