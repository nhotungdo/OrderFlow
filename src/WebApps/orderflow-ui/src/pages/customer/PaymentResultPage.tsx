import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
  ShoppingBag,
  Mail,
} from 'lucide-react';
import type { Order } from '../../types';
import { ordersApi } from '../../api/ordersApi';

export const PaymentResultPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const pollOrder = async () => {
    if (!orderId) return;
    try {
      const data = await ordersApi.getOrderById(orderId);
      if (data) {
        setOrder(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    pollOrder();
    // Poll every 1.5 seconds until finalized (Paid or Cancelled)
    const interval = setInterval(() => {
      pollOrder();
    }, 1500);

    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <div className="py-24 text-center max-w-md mx-auto space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">Contacting Distributed Services...</h2>
        <p className="text-xs text-slate-400">
          Querying OrderService via Outbox & RabbitMQ Choreography
        </p>
      </div>
    );
  }

  const isPending = order?.status === 'Pending' || order?.status === 'StockReserved';
  const isPaid = order?.status === 'Paid' || order?.status === 'Completed';
  const isCancelled = order?.status === 'Cancelled';

  return (
    <div className="py-12 max-w-xl mx-auto space-y-6">
      {/* Result Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Background glow based on status */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-3xl pointer-events-none ${
            isPaid ? 'bg-emerald-500/10' : isCancelled ? 'bg-rose-500/10' : 'bg-blue-500/10'
          }`}
        />

        {/* Status Icon */}
        <div className="relative z-10">
          {isPending ? (
            <div className="w-20 h-20 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center mx-auto animate-pulse">
              <RefreshCw className="w-10 h-10 animate-spin" />
            </div>
          ) : isPaid ? (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <XCircle className="w-10 h-10" />
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-2 relative z-10">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {isPending && 'Processing Distributed Saga...'}
            {isPaid && 'Payment Succeeded & Order Confirmed!'}
            {isCancelled && 'Payment Failed — Order Cancelled'}
          </h1>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {isPending &&
              'Your order has been recorded into the Transactional Outbox. Inventory reservation and payment gateway transactions are currently executing across the event bus.'}
            {isPaid &&
              'The distributed transaction completed successfully across OrderService, InventoryService, and PaymentService. Confirmation email dispatched via Mailpit.'}
            {isCancelled && (
              <span>
                Payment gateway declined transaction ({order?.failureReason || 'Insufficient funds'}).
                <strong className="block text-amber-400 mt-1">
                  Distributed Compensation: Stock reservation was automatically refunded and restored in PostgreSQL.
                </strong>
              </span>
            )}
          </p>
        </div>

        {/* Order Details Mini-Card */}
        {order && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2.5 text-xs font-mono relative z-10">
            <div className="flex justify-between text-slate-400">
              <span>Order Code:</span>
              <span className="text-white font-bold">{order.orderCode}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Status:</span>
              <span
                className={`font-bold ${
                  isPaid ? 'text-emerald-400' : isCancelled ? 'text-rose-400' : 'text-blue-400'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Total Amount:</span>
              <span className="text-white font-bold">${order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Payment Gateway:</span>
              <span className="text-indigo-400">{order.paymentMethod}</span>
            </div>
            {order.idempotencyKey && (
              <div className="flex justify-between text-slate-500 text-[10px] truncate">
                <span>Idempotency Key:</span>
                <span className="truncate max-w-[200px]">{order.idempotencyKey}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10 pt-2">
          <Link
            to="/products"
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition border border-slate-700"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
          <Link
            to={orderId ? `/orders/${orderId}` : '/orders'}
            className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30"
          >
            <span>View Order Details</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mailpit Link Notice */}
        {isPaid && (
          <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-2">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>
              Inspect dispatched email in Mailpit Web UI:{' '}
              <a
                href="http://localhost:8025"
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 underline font-mono"
              >
                http://localhost:8025
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
