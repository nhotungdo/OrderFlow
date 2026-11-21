import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Server,
  Layers,
  Activity,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import type { Order, Product } from '../../types';
import { ordersApi } from '../../api/ordersApi';
import { inventoryApi } from '../../api/inventoryApi';

export const DashboardOverviewPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [ordData, prodData] = await Promise.all([
        ordersApi.getOrders(),
        inventoryApi.getProducts(),
      ]);
      setOrders(ordData);
      setProducts(prodData);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const totalOrders = orders.length;
  const paidOrders = orders.filter((o) => o.status === 'Paid' || o.status === 'Completed');
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');
  const pendingOrders = orders.filter((o) => o.status === 'Pending' || o.status === 'StockReserved');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const successRate = totalOrders > 0 ? Math.round((paidOrders.length / totalOrders) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">System Overview & Observability</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry across Distributed Microservices, Redis Cache, and RabbitMQ Message Bus
          </p>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-300">Telemetry Stream: Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalOrders}</div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="text-emerald-400 font-semibold">{pendingOrders.length} pending</span>
            <span>across event choreography</span>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Processed Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            ${totalRevenue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500">
            Captured across {paidOrders.length} successful transactions
          </div>
        </div>

        {/* Success Rate SLA */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Saga Success Rate</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{successRate}%</div>
          <div className="text-[10px] text-slate-500">
            Target: &gt; 95% SLA Under High Concurrency
          </div>
        </div>

        {/* Compensated / Cancelled */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Compensations</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{cancelledOrders.length}</div>
          <div className="text-[10px] text-slate-500">
            Stock safely refunded via Saga Rollback
          </div>
        </div>
      </div>

      {/* 4 Showcase Banners for CV Interview */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Core Technical Showcases (Key Topics for Technical Interview)
            </h2>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-900 text-indigo-300">
            CV Portfolio Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/inventory"
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-blue-400 mb-2">
                <Layers className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase bg-blue-950 px-1.5 py-0.5 rounded text-blue-300">
                  Showcase 1
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                2-Tier Inventory Engine
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Redis Lua hold + PostgreSQL conditional check to guarantee zero overselling.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-medium text-blue-400 flex items-center gap-1">
              <span>Inspect Table</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to={orders.length > 0 ? `/admin/orders/${orders[0].id}` : '/admin/orders'}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                <Server className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase bg-emerald-950 px-1.5 py-0.5 rounded text-emerald-300">
                  Showcase 2
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                Distributed Saga Inspector
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Visual choreography state machine, Outbox message ID, and compensation paths.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span>View Timeline</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/system/events"
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-amber-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase bg-amber-950 px-1.5 py-0.5 rounded text-amber-300">
                  Showcase 3
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-amber-400 transition">
                RabbitMQ Event Monitor
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Consumer queue lags, rate metrics, and MassTransit message bus topology.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-medium text-amber-400 flex items-center gap-1">
              <span>Monitor Queues</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            to="/admin/system/dlq"
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-rose-500/50 transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-rose-400 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-[9px] font-mono uppercase bg-rose-950 px-1.5 py-0.5 rounded text-rose-300">
                  Showcase 4
                </span>
              </div>
              <div className="text-xs font-bold text-white group-hover:text-rose-400 transition">
                DLQ & Safe Replay
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Poison message analysis, C# stack trace view, and idempotent replay runner.
              </p>
            </div>
            <div className="mt-3 text-[11px] font-medium text-rose-400 flex items-center gap-1">
              <span>Inspect DLQ</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Latest Inbound Orders (Live Auto-Polling 3s)
          </h2>
          <Link
            to="/admin/orders"
            className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>View All ({orders.length})</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">No orders recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-3 px-3">Order Code</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Inspect Saga</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.slice(0, 5).map((ord) => {
                  const isPaid = ord.status === 'Paid' || ord.status === 'Completed';
                  const isCancelled = ord.status === 'Cancelled';
                  const isPending = ord.status === 'Pending' || ord.status === 'StockReserved';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        <Link to={`/admin/orders/${ord.id}`} className="hover:text-indigo-400">
                          {ord.orderCode}
                        </Link>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(ord.createdAtUtc).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        ${ord.totalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                        {ord.paymentMethod}
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/admin/orders/${ord.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 text-[11px] transition"
                        >
                          <span>Saga Flow</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
