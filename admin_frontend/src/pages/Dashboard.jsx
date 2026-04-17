import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import { Table } from '../components/Table';
import { getStatusBadge } from '../components/statusBadge';
import { IndianRupee, ShoppingCart, Package, Users } from 'lucide-react';
import { api } from '../services/api';
import { formatINR } from '../utils/currency';

const Dashboard = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0 
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData] = await Promise.all([
          api.getProducts().catch(() => []),
          api.getOrders().catch(() => [])
        ]);

        const products = Array.isArray(productsData) ? productsData : (productsData.products || []);
        const orders = Array.isArray(ordersData) ? ordersData : (ordersData.orders || []);

        // Calculate Revenue (all not Cancelled orders)
        const revenue = orders.reduce((sum, order) => {
          if ((order.orderStatus || order.status || '').toLowerCase() !== 'cancelled') {
            return sum + Number(order.totalPrice || order.total || 0);
          }
          return sum;
        }, 0);

        // Calculate Unique Customers
        const uniqueCustomers = new Set(
          orders.map(o => o.user || o.customer || o.shippingAddress?.fullName)
        ).size;

        setStats({
          products: products.length,
          orders: orders.length,
          revenue: isNaN(revenue) ? 0 : revenue,
          customers: uniqueCustomers || 0
        });

        // Set top 5 recent orders
        const sortedOrders = orders.sort((a,b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
        setRecentOrders(sortedOrders.slice(0, 5));
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
         <span className="text-gray-900">{row.customer || (row.shippingAddress?.fullName || 'Unknown')}</span>
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
      render: (row) => getStatusBadge(row.orderStatus || row.status || 'Pending')
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back, here's what's happening today.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Grid of 4 Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="Total Revenue" 
              value={formatINR(stats.revenue)} 
              icon={<IndianRupee size={20} />} 
              trend="up" 
              trendValue="12.5%" 
            />
            <StatCard 
              title="Orders" 
              value={stats.orders} 
              icon={<ShoppingCart size={20} />} 
              trend="up" 
              trendValue="4.2%" 
            />
            <StatCard 
              title="Products" 
              value={stats.products} 
              icon={<Package size={20} />} 
            />
            <StatCard 
              title="Customers" 
              value={stats.customers} 
              icon={<Users size={20} />} 
              trend="up" 
              trendValue="1.1%" 
            />
          </div>

          {/* Recent Orders Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 px-1">Recent Orders</h2>
            <Table 
              columns={columns} 
              data={recentOrders} 
              keyExtractor={(row) => row._id || row.id || Math.random().toString()} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
