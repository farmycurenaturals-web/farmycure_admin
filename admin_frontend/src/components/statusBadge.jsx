import React from 'react';

const normalizeKey = (status) => String(status || '').trim().toLowerCase();

export const getStatusBadge = (status) => {
  const baseClasses = 'px-2.5 py-1 text-xs font-semibold rounded-full';
  const key = normalizeKey(status);
  const label = String(status || 'Placed').trim() || 'Placed';

  switch (key) {
    case 'placed':
      return <span className={`${baseClasses} bg-slate-100 text-slate-700`}>Placed</span>;
    case 'processing':
      return <span className={`${baseClasses} bg-blue-100 text-blue-700`}>Processing</span>;
    case 'shipped':
      return <span className={`${baseClasses} bg-indigo-100 text-indigo-700`}>Shipped</span>;
    case 'delivered':
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>Delivered</span>;
    case 'cancelled':
    case 'canceled':
      return <span className={`${baseClasses} bg-red-100 text-red-700`}>Cancelled</span>;
    case 'completed':
      return <span className={`${baseClasses} bg-green-100 text-green-700`}>Delivered</span>;
    case 'pending':
      return <span className={`${baseClasses} bg-amber-100 text-amber-800`}>Placed</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-700`}>{label}</span>;
  }
};
