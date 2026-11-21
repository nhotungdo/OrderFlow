import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types';
import { ordersApi } from '../../api/ordersApi';
import { useAuth } from '../../contexts/AuthContext';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatus>('All');
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  const loadOrders = async () => {
    try {
      const data = await ordersApi.getOrders();
      setOrders(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const statuses: ('All' | OrderStatus)[] = ['All', 'Paid', 'Pending', 'StockReserved', 'Cancelled'];

  const filtered = orders.filter((ord) => {
    const matchStatus = statusFilter === 'All' || ord.status === statusFilter;
    const matchSearch =
      ord.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      ord.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">My Orders</h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking distributed orders for <strong className="text-slate-200">{user.name}</strong>
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>New Order</span>
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order Code or ID..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition shrink-0 ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No orders found.</p>
          <Link
            to="/products"
            className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium"
          >
            Create Your First Order
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-4">Order Code</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((ord) => {
                  const isPaid = ord.status === 'Paid' || ord.status === 'Completed';
                  const isCancelled = ord.status === 'Cancelled';
                  const isPending = ord.status === 'Pending' || ord.status === 'StockReserved';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-850/60 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <Link to={`/orders/${ord.id}`} className="hover:text-blue-400 transition">
                          {ord.orderCode}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(ord.createdAtUtc).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {ord.items?.length || 0} item(s)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        ${ord.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                        {ord.paymentMethod}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isCancelled
                              ? 'bg-rose-950 text-rose-400 border border-rose-800'
                              : 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                          }`}
                        >
                          {isPaid && <CheckCircle2 className="w-3 h-3" />}
                          {isCancelled && <XCircle className="w-3 h-3" />}
                          {isPending && <Clock className="w-3 h-3" />}
                          <span>{ord.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition text-[11px]"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
