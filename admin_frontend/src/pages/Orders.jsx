import React, { useState, useEffect } from 'react';
import { Table } from '../components/Table';
import { getStatusBadge } from '../components/statusBadge';
import { api } from '../services/api';
import { AlertCircle } from 'lucide-react';
import { formatINR } from '../utils/currency';

const ORDER_STATUSES = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

/** Map legacy DB values to the current enum for the dropdown. */
const normalizeOrderStatus = (raw) => {
  if (raw === undefined || raw === null || raw === '') return 'Placed';
  const s = String(raw).trim();
  if (ORDER_STATUSES.includes(s)) return s;
  const lower = s.toLowerCase();
  const legacy = {
    pending: 'Placed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    completed: 'Delivered',
    cancelled: 'Cancelled',
    canceled: 'Cancelled'
  };
  return legacy[lower] || 'Placed';
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchOrders = async (opts = {}) => {
    const silent = Boolean(opts.silent);
    try {
      if (!silent) setLoading(true);
      const data = await api.getOrders();
      setOrders(Array.isArray(data) ? data : (data.orders || []));
      setError('');
    } catch (err) {
      setError('Failed to fetch orders. Check backend connection.');
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order #${String(orderId).substring(0, 8)} status updated to ${newStatus}`);
      await fetchOrders({ silent: true });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.message || 'Failed to update order status');
      setTimeout(() => setError(''), 4000);
    }
  };

  const columns = [
    { 
      title: 'Order ID', 
      dataIndex: '_id',
      render: (row) => <span className="font-medium text-gray-900">{(row._id || row.id)?.substring(0,8) || '#...'}</span>
    },
    { 
      title: 'Customer', 
      dataIndex: 'customer',
      render: (row) => (
         <span className="text-gray-900">{row.customer || (row.shippingAddress?.fullName || 'Unknown Customer')}</span>
      )
    },
    { 
      title: 'Date', 
      dataIndex: 'createdAt',
      render: (row) => {
        const dateStr = row.createdAt || row.date;
        return <span className="text-gray-500">{dateStr ? new Date(dateStr).toLocaleDateString() : 'N/A'}</span>;
      }
    },
    { 
      title: 'Total (INR)', 
      dataIndex: 'totalPrice',
      render: (row) => (
        <span className="font-medium text-gray-900">
          {formatINR(row.totalPrice ?? row.total ?? 0)}
        </span>
      ),
    },
    { 
      title: 'Status', 
      dataIndex: 'status',
      render: (row) => {
        const id = row._id || row.id;
        const value = normalizeOrderStatus(row.status);
        return (
          <div className="flex items-center gap-3 flex-wrap">
            {getStatusBadge(row.status)}
            <select
              value={value}
              onChange={(e) => handleStatusChange(id, e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 cursor-pointer min-w-[9.5rem]"
              aria-label="Update order status"
            >
              {ORDER_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-green-100">
          <AlertCircle size={16} /> {success}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage customer orders and fulfillments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={orders} 
          keyExtractor={(row) => row._id || row.id || Math.random().toString()} 
        />
      )}
    </div>
  );
};

export default Orders;
