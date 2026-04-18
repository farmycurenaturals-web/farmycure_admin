import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Search, Package, ShoppingBag, AlertTriangle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Topbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [badgeCount, setBadgeCount] = useState(0);
  const [alertItems, setAlertItems] = useState([]);
  const panelRef = useRef(null);

  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true);
    try {
      const [ordersRaw, productsRaw] = await Promise.all([
        api.getOrders().catch(() => []),
        api.getProducts().catch(() => []),
      ]);
      const orders = Array.isArray(ordersRaw) ? ordersRaw : ordersRaw.orders || [];
      const products = Array.isArray(productsRaw) ? productsRaw : productsRaw.products || [];

      const pending = orders.filter((o) => (o.status || '').toLowerCase() === 'pending');
      const processing = orders.filter((o) => (o.status || '').toLowerCase() === 'processing');
      const outOfStock = products.filter((p) => Number(p.stock) === 0);

      const items = [];
      if (pending.length) {
        items.push({
          id: 'pending-orders',
          icon: ShoppingBag,
          title: `${pending.length} pending order${pending.length !== 1 ? 's' : ''}`,
          detail: 'Awaiting confirmation or status update',
          link: '/orders',
          tone: 'amber',
        });
      }
      if (processing.length) {
        items.push({
          id: 'processing-orders',
          icon: Package,
          title: `${processing.length} order${processing.length !== 1 ? 's' : ''} in processing`,
          detail: 'Being prepared or shipped',
          link: '/orders',
          tone: 'blue',
        });
      }
      if (outOfStock.length) {
        items.push({
          id: 'out-of-stock',
          icon: AlertTriangle,
          title: `${outOfStock.length} product${outOfStock.length !== 1 ? 's' : ''} out of stock`,
          detail: 'Restock or update inventory',
          link: '/products',
          tone: 'red',
        });
      }

      if (items.length === 0) {
        items.push({
          id: 'all-clear',
          icon: Bell,
          title: "You're all caught up",
          detail: 'No pending alerts right now',
          link: null,
          tone: 'neutral',
        });
      }

      setAlertItems(items);
      setBadgeCount(pending.length + outOfStock.length);
    } catch {
      setAlertItems([
        {
          id: 'error',
          icon: AlertTriangle,
          title: 'Could not load alerts',
          detail: 'Check that the backend is running',
          link: null,
          tone: 'red',
        },
      ]);
      setBadgeCount(0);
    } finally {
      setLoadingAlerts(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  useEffect(() => {
    if (!notificationsOpen) return;
    loadAlerts();
  }, [notificationsOpen, loadAlerts]);

  useEffect(() => {
    if (!notificationsOpen) return;
    const onDoc = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [notificationsOpen]);

  const goTo = (path) => {
    if (path) {
      navigate(path);
      setNotificationsOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 sticky top-0 z-10 w-full flex items-center justify-between px-6 lg:px-8">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <img
          src="/farmycure-logo.png"
          alt="FarmyCure"
          className="h-8 w-auto rounded-md border border-green-100 bg-white p-0.5 hidden sm:block"
        />
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search size={18} className="text-gray-400" />
          </span>
          <input
            type="search"
            placeholder="Search..."
            className="w-full bg-gray-50 text-gray-900 text-sm rounded-lg border border-transparent focus:border-green-500 focus:bg-white focus:ring-1 focus:ring-green-500 py-2 pl-10 pr-4 transition-colors outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        <div className="relative" ref={panelRef}>
          <button
            type="button"
            onClick={() => setNotificationsOpen((o) => !o)}
            className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-50"
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
            aria-label={`Notifications${badgeCount > 0 ? `, ${badgeCount} alerts` : ''}`}
          >
            <Bell size={20} />
            {badgeCount > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white leading-none"
                aria-hidden
              >
                {badgeCount > 9 ? '9+' : badgeCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 max-h-[min(24rem,calc(100vh-5rem))] overflow-hidden flex flex-col rounded-xl border border-gray-200 bg-white shadow-lg z-50"
              role="dialog"
              aria-label="Notifications"
            >
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
                <span className="text-sm font-semibold text-gray-900">Alerts</span>
                {badgeCount > 0 && (
                  <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    {badgeCount} need attention
                  </span>
                )}
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {loadingAlerts && alertItems.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">Loading…</p>
                ) : (
                  alertItems.map((item) => {
                    const Icon = item.icon;
                    const toneRing =
                      item.tone === 'red'
                        ? 'bg-red-50 text-red-600'
                        : item.tone === 'amber'
                          ? 'bg-amber-50 text-amber-600'
                          : item.tone === 'blue'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-gray-100 text-gray-500';
                    const rowClass =
                      'w-full text-left px-4 py-3 flex gap-3 border-b border-gray-50 last:border-0';
                    const inner = (
                      <>
                        <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${toneRing}`}>
                          <Icon size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-gray-900 block">{item.title}</span>
                          <span className="text-xs text-gray-500 mt-0.5 block">{item.detail}</span>
                        </span>
                        {item.link && <ChevronRight size={18} className="shrink-0 text-gray-300 mt-1" />}
                      </>
                    );
                    return item.link ? (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => goTo(item.link)}
                        className={`${rowClass} hover:bg-gray-50 transition-colors cursor-pointer`}
                      >
                        {inner}
                      </button>
                    ) : (
                      <div key={item.id} className={rowClass}>
                        {inner}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo('/orders')}
                  className="flex-1 text-xs font-medium text-green-700 hover:text-green-800 py-2 rounded-lg hover:bg-green-50"
                >
                  Orders
                </button>
                <button
                  type="button"
                  onClick={() => goTo('/products')}
                  className="flex-1 text-xs font-medium text-green-700 hover:text-green-800 py-2 rounded-lg hover:bg-green-50"
                >
                  Products
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="text-xs px-3 py-1.5 border border-gray-200 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Logout ({user?.role || 'admin'})
        </button>
      </div>
    </header>
  );
};

export default Topbar;
