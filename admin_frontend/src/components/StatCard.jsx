import React from 'react';

const StatCard = ({ title, value, icon, trend, trendValue }) => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
        
        {trend && trendValue && (
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className={`font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
            <span className="text-gray-400">vs last month</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
