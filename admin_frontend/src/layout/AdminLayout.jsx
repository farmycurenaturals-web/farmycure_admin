import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-[#f9fafb] text-gray-900 font-sans">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Wrapper - Margin left equal to sidebar width to prevent overlap */}
      <div className="flex-1 flex flex-col ml-[240px] min-w-0">
        {/* Sticky Topbar */}
        <Topbar />

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto box-border overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
