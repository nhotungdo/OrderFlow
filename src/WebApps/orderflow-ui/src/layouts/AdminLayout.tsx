import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Boxes,
  Layers,
  History,
  ShoppingCart,
  CreditCard,
  Activity,
  AlertTriangle,
  Store,
  RefreshCw,
  Server,
  Database,
  Radio,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../api/client';

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [serviceStatus, setServiceStatus] = useState({
    orders: true,
    inventory: true,
    payments: true,
  });
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const checkHealth = async () => {
    try {
      await apiClient.get('/api/orders');
      setServiceStatus((prev) => ({ ...prev, orders: true }));
    } catch {
      setServiceStatus((prev) => ({ ...prev, orders: false }));
    }

    try {
      await apiClient.get('/api/inventory/products');
      setServiceStatus((prev) => ({ ...prev, inventory: true }));
    } catch {
      setServiceStatus((prev) => ({ ...prev, inventory: false }));
    }

    setLastCheck(new Date());
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { name: 'Dashboard Overview', path: '/admin', icon: LayoutDashboard },
    { name: 'Product Management', path: '/admin/products', icon: Boxes },
    { name: '2-Tier Inventory', path: '/admin/inventory', icon: Layers, badge: 'Showcase' },
    { name: 'Stock Movement Audit', path: '/admin/inventory/history', icon: History },
    { name: 'Order Management', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Payment Transactions', path: '/admin/payments', icon: CreditCard },
    { name: 'Event Processing Monitor', path: '/admin/system/events', icon: Activity, badge: 'RabbitMQ' },
    { name: 'Failed Events & DLQ', path: '/admin/system/dlq', icon: AlertTriangle, badge: 'DLQ' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white">OrderFlow</span>
              <span className="block text-[10px] text-indigo-400 font-mono">OBSERVABILITY</span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
            Operations & Core
          </div>
          {navItems.slice(0, 6).map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-indigo-900/40 text-indigo-300 border border-indigo-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-3 mt-6 mb-2">
            Distributed Reliability
          </div>
          {navItems.slice(6).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/20 text-white' : 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Microservices Health Pill */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
            <span>Cluster Services</span>
            <button
              onClick={checkHealth}
              className="text-slate-500 hover:text-slate-300 transition"
              title="Refresh Health"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">OrderService (5000)</span>
              <span className={`w-2 h-2 rounded-full ${serviceStatus.orders ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">InventoryService (5002)</span>
              <span className={`w-2 h-2 rounded-full ${serviceStatus.inventory ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PaymentService (5004)</span>
              <span className={`w-2 h-2 rounded-full ${serviceStatus.payments ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">RabbitMQ (5672)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>

        {/* Back to Customer Store */}
        <div className="p-3 border-t border-slate-800">
          <Link
            to="/products"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            <Store className="w-3.5 h-3.5 text-blue-400" />
            <span>Switch to Customer Portal</span>
          </Link>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>PostgreSQL (5432)</span>
              <span>•</span>
              <Radio className="w-3.5 h-3.5 text-red-400" />
              <span>Redis (6379)</span>
              <span>•</span>
              <Activity className="w-3.5 h-3.5 text-amber-400" />
              <span>MassTransit Bus</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-500 font-mono">
              Last Ping: {lastCheck.toLocaleTimeString()}
            </span>
            <div className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-800/60 text-xs text-indigo-300 font-medium">
              Admin: {user.name}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
