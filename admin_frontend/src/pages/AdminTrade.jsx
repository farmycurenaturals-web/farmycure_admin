import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '../components/Table';
import { apiAdmin } from '../services/apiAdmin';

const AdminTrade = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiAdmin.getWithAutoRefresh('/api/admin/trade');
        setRows(Array.isArray(res.data) ? res.data : res.data?.trades || []);
      } catch (err) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || 'Failed to load trade requests';
        if (status === 401) {
          localStorage.removeItem('farmycure_token');
          localStorage.removeItem('farmycure_refresh_token');
          localStorage.removeItem('farmycure_user');
          navigate('/login', { replace: true });
          return;
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
    { title: 'Contact', dataIndex: 'contact' },
    { title: 'Product', dataIndex: 'product' },
    { title: 'Quantity', dataIndex: 'quantity' },
    {
      title: 'Preferred Time (User)',
      dataIndex: 'preferredTime',
      render: (row) => (
        <div>
          <span>{row.preferredTime || '-'}</span>
          <div className="text-xs text-gray-500">({row.timezone || '—'})</div>
        </div>
      ),
    },
    {
      title: 'Converted Time (IST)',
      dataIndex: 'convertedTimeIST',
      render: (row) => {
        const { start, end, outsideBusinessHours } = row.convertedTimeIST || {};
        const hasRange = start && end;
        return (
          <div>
            {hasRange ? (
              <>
                <span>
                  {start} – {end}
                </span>
                <div className="text-xs text-gray-500">(India Time)</div>
                {outsideBusinessHours && (
                  <div className="text-red-500 text-xs mt-0.5">Outside business hours</div>
                )}
              </>
            ) : (
              <span className="text-gray-400">—</span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Contact Method',
      dataIndex: 'contactMethod',
      render: (row) => row.contactMethod || '-',
    },
    { title: 'Legal Name', dataIndex: 'legalName' },
    { title: 'GST', dataIndex: 'gst' },
    {
      title: 'Message',
      dataIndex: 'message',
      render: (row) => <span className="max-w-[240px] inline-block truncate">{row.message || '-'}</span>,
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Trade Requests</h1>
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

export default AdminTrade;
