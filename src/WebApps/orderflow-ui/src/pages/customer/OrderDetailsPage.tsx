import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  MapPin,
  CreditCard,
  Ban,
  Package,
} from 'lucide-react';
import type { Order } from '../../types';
import { ordersApi } from '../../api/ordersApi';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    if (!id) return;
    try {
      const data = await ordersApi.getOrderById(id);
      if (data) setOrder(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadOrder, 2500);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order? This will trigger distributed stock compensation.')) {
      return;
    }
    setCancelling(true);
    await ordersApi.cancelOrder(order.id);
    await loadOrder();
    setCancelling(false);
  };

  if (loading && !order) {
    return <div className="py-20 text-center text-slate-400 text-xs">Loading order details...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Order not found.</p>
        <Link to="/orders" className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'Paid' || order.status === 'Completed';
  const isCancelled = order.status === 'Cancelled';
  const isPending = order.status === 'Pending' || order.status === 'StockReserved';

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">{order.orderCode}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : isCancelled
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-blue-950 text-blue-400 border border-blue-800 animate-pulse'
                }`}
              >
                {order.status}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Created at: {new Date(order.createdAtUtc).toLocaleString()} • ID: {order.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to Admin Technical Saga Inspector */}
          <Link
            to={`/admin/orders/${order.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-300 hover:text-white text-xs font-medium transition"
          >
            <span>Inspect in Admin Saga</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Cancel button if pending */}
          {isPending && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-3 py-2 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer State Machine Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
          Order State Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: Placed */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Order Placed</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Written into PostgreSQL Outbox</p>
            </div>
          </div>

          {/* Step 2: Stock Reserved */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isPaid || order.status === 'StockReserved'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : isCancelled
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : 'bg-blue-500/20 border border-blue-500/40 text-blue-400 animate-pulse'
              }`}
            >
              {isCancelled ? <XCircle className="w-4 h-4" /> : <Package className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Stock Reservation</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isCancelled ? 'Compensated & Released' : 'Held by InventoryService'}
              </p>
            </div>
          </div>

          {/* Step 3: Payment Processed */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isPaid
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : isCancelled
                  ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-4 h-4" /> : isCancelled ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Payment Processing</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isPaid ? 'Payment Captured' : isCancelled ? 'Payment Declined' : 'Pending Gateway'}
              </p>
            </div>
          </div>

          {/* Step 4: Final State */}
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isPaid
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                  : isCancelled
                  ? 'bg-slate-800 text-slate-500'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {isPaid ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Order Fulfilled</div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {isPaid ? 'Notification Dispatched' : 'Pending Completion'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
            Order Items ({order.items?.length || 0})
          </h2>

          <div className="divide-y divide-slate-800">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-white">{item.productName}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Product ID: {item.productId}
                  </div>
                  <div className="text-slate-400 mt-0.5">
                    {item.quantity} × ${item.unitPrice.toLocaleString()}
                  </div>
                </div>
                <div className="font-mono font-bold text-white text-sm">
                  ${item.totalPrice.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-sm">
            <span className="font-bold text-slate-300">Total Order Amount</span>
            <span className="font-mono font-black text-blue-400 text-base">
              ${order.totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Metadata Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Shipping destination */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>Delivery Information</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Customer: <strong className="text-slate-200">{order.customerName || order.customerId}</strong></div>
              <div>Address: <span className="text-slate-300">{order.shippingAddress || '789 Le Duan, Da Nang'}</span></div>
            </div>
          </div>

          {/* Payment information */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Payment Details</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div>Method: <strong className="text-white font-mono">{order.paymentMethod}</strong></div>
              {order.failureReason && (
                <div className="text-rose-400 text-[11px] flex items-start gap-1 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Failure: {order.failureReason}</span>
                </div>
              )}
            </div>
          </div>

          {/* Idempotency Key */}
          {order.idempotencyKey && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                X-Idempotency-Key
              </div>
              <div className="p-2 rounded-lg bg-slate-950 font-mono text-[10px] text-emerald-400 break-all border border-slate-800">
                {order.idempotencyKey}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
