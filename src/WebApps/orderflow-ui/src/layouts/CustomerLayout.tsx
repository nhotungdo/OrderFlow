import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, ShoppingCart, Package, Shield, Layers, UserCheck } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

export const CustomerLayout: React.FC = () => {
  const { totalItems } = useCart();
  const { user, switchUser } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner: Distributed System Highlight */}
      <div className="bg-gradient-to-r from-blue-900/60 via-indigo-900/40 to-slate-900 border-b border-blue-500/20 px-4 py-1.5 text-xs text-blue-300 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-slate-200">OrderFlow Engine Active:</span>
          <span className="text-slate-400 hidden sm:inline">Redis 2-Tier Concurrency • Strict Idempotency • Transactional Outbox • RabbitMQ Saga</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-indigo-600/80 hover:bg-indigo-500 text-white font-medium text-xs transition"
          >
            <Shield className="w-3 h-3" />
            <span>Open Admin Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/products" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black tracking-tight text-lg text-white flex items-center gap-1.5">
                OrderFlow
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Store
                </span>
              </div>
              <p className="text-[11px] text-slate-400">High-Concurrency Distributed Store</p>
            </div>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/products"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                location.pathname === '/products' || location.pathname === '/'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Products</span>
            </Link>
            <Link
              to="/orders"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                location.pathname.startsWith('/orders')
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center gap-3">
            {/* Mock User Pill */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 font-medium hidden sm:inline">{user.name}</span>
              <button
                onClick={() => switchUser(user.role === 'Customer' ? 'Admin' : 'Customer')}
                className="text-[10px] text-blue-400 hover:text-blue-300 underline ml-1 font-mono"
                title="Switch demo user role"
              >
                [Switch]
              </button>
            </div>

            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="View Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-400">OrderFlow Distributed Order Processing</span> — ASP.NET Core (.NET 9) • PostgreSQL 16 • Redis 7.2 • RabbitMQ 3.13
          </div>
          <div className="flex items-center gap-4">
            <Link to="/admin" className="text-indigo-400 hover:underline">
              Admin Observability
            </Link>
            <span>•</span>
            <Link to="/products" className="text-blue-400 hover:underline">
              Customer Store
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
