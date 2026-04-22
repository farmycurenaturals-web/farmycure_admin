import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../components/Table';
import { apiAdmin } from '../services/apiAdmin';

const AdminContact = () => {
  const getErrorText = (err, fallback) => {
    const raw = err?.response?.data;
    if (typeof raw === 'string') return fallback;
    return err?.response?.data?.message || err?.message || fallback;
  };

  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiAdmin.getWithAutoRefresh('/api/admin/contact');
        setRows(Array.isArray(res.data) ? res.data : res.data?.contacts || []);
      } catch (err) {
        const status = err?.response?.status;
        const msg = getErrorText(err, 'Contact API not available on deployed backend yet.');
        if (status === 401) {
          sessionStorage.removeItem('farmycure_token');
          sessionStorage.removeItem('farmycure_refresh_token');
          sessionStorage.removeItem('farmycure_user');
          navigate('/login', { replace: true });
          return;
        }
        if (status === 404) {
          setRows([]);
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Subject', dataIndex: 'subject' },
    {
      title: 'Message',
      dataIndex: 'message',
      render: (row) => <span className="max-w-[280px] inline-block truncate">{row.message}</span>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Contact Messages</h1>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <div className="py-10 text-gray-500">Loading...</div>
      ) : (
        <Table columns={columns} data={rows} keyExtractor={(row) => row._id} />
      )}
    </div>
  );
};

export default AdminContact;
