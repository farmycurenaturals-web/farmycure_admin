import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Tags, Handshake, MessageSquare } from 'lucide-react';

const Sidebar = () => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Categories', path: '/categories', icon: <Tags size={20} /> },
    { name: 'Products', path: '/products', icon: <Package size={20} /> },
    { name: 'Trade', path: '/trade', icon: <Handshake size={20} /> },
    { name: 'Contact', path: '/contact', icon: <MessageSquare size={20} /> },
  ];

  return (
    <aside className="w-[240px] bg-white border-r border-gray-100 flex-shrink-0 fixed left-0 top-0 h-screen flex flex-col z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src="/farmycure-logo.png"
            alt="FarmyCure"
            className="h-10 w-auto rounded-md border border-green-100 bg-white p-0.5"
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-100 text-green-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
