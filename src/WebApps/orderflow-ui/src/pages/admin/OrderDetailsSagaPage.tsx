import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Server,
  Copy,
  Check,
  Code,
  ShieldCheck,
} from 'lucide-react';
import type { Order } from '../../types';
import { ordersApi } from '../../api/ordersApi';

export const OrderDetailsSagaPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  if (loading && !order) {
    return <div className="py-20 text-center text-slate-500 text-xs">Loading Saga telemetry...</div>;
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-slate-400 text-sm">Order not found.</p>
        <Link to="/admin/orders" className="mt-3 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'Paid' || order.status === 'Completed';
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/orders"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">{order.orderCode}</h1>
              <span className="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 text-[10px] font-mono uppercase">
                Showcase 2: Saga Inspector
              </span>
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
              Correlation ID: {order.id} • Created: {new Date(order.createdAtUtc).toLocaleString()}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowJsonPayload(!showJsonPayload)}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono flex items-center gap-2 transition"
        >
          <Code className="w-4 h-4 text-indigo-400" />
          <span>{showJsonPayload ? 'Hide JSON Event' : 'View Raw Outbox Payload'}</span>
        </button>
      </div>

      {/* JSON Viewer Modal / Collapsible */}
      {showJsonPayload && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-900/50 space-y-2">
          <div className="text-xs font-mono font-bold text-indigo-400 flex items-center justify-between">
            <span>Transactional Outbox Message Snapshot (PostgreSQL Table: `outbox_messages`)</span>
            <button
              onClick={() => handleCopy(JSON.stringify(order, null, 2), 'json')}
              className="text-slate-400 hover:text-white text-[11px] flex items-center gap-1"
            >
              {copiedKey === 'json' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copy JSON</span>
            </button>
          </div>
          <pre className="p-3 bg-black/60 rounded-xl font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-60 border border-slate-800">
            {JSON.stringify(order, null, 2)}
          </pre>
        </div>
      )}

      {/* Distributed Saga Choreography Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-400" />
            <span>Distributed Choreography Execution Path</span>
          </h2>
          <span className="text-[10px] text-slate-400 font-mono">Broker: MassTransit / RabbitMQ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Stage 1: OrderCreated & Outbox */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                Step 1: Outbox
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">OrderCreatedEvent</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">OrderService (5000)</div>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Order saved in PostgreSQL. Outbox processor background service polled and published event to RabbitMQ exchange.
            </p>
            <div className="text-[10px] font-mono text-emerald-400">Status: Dispatched & Acked</div>
          </div>

          {/* Stage 2: StockReserved */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                Step 2: Inventory
              </span>
              {isCancelled ? (
                <XCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white">StockReservedEvent</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">InventoryService (5002)</div>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {isCancelled
                ? 'Initially reserved via atomic conditional SQL; subsequently compensated and refunded.'
                : 'Atomic row-level conditional update verified available quantity and locked items.'}
            </p>
            <div className="text-[10px] font-mono text-blue-400">
              Queue: `inventory-service-reserve`
            </div>
          </div>

          {/* Stage 3: Payment */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                Step 3: Payment
              </span>
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isCancelled ? (
                <XCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {isPaid ? 'PaymentCompletedEvent' : 'PaymentFailedEvent'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">PaymentService (5004)</div>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              Gateway evaluated method <strong className="text-white font-mono">{order.paymentMethod}</strong>.
              {isCancelled && ` Declined with reason: ${order.failureReason || 'Insufficient funds'}.`}
            </p>
            <div className="text-[10px] font-mono text-amber-400">
              Gateway Latency: 12ms
            </div>
          </div>

          {/* Stage 4: Resolution / Compensation */}
          <div
            className={`p-4 rounded-xl border space-y-3 relative ${
              isPaid
                ? 'bg-emerald-950/20 border-emerald-800/60'
                : isCancelled
                ? 'bg-rose-950/20 border-rose-800/60'
                : 'bg-slate-950/80 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                Step 4: Result
              </span>
              {isPaid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isCancelled ? (
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              ) : (
                <Clock className="w-4 h-4 text-slate-500" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {isPaid ? 'Order Fulfillment' : 'Saga Compensation'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {isPaid ? 'NotificationService' : 'Inventory Rollback'}
              </div>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {isPaid
                ? 'Order confirmed as Paid. Email notification dispatched to customer mailbox via Mailpit.'
                : 'ReleaseStockCommand dispatched to InventoryService; reserved items returned to Available stock.'}
            </p>
            <div className="text-[10px] font-mono font-bold text-slate-200">
              Final Consistency: 100% ACID
            </div>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchased Items */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400">
            Order Items & Inventory Association
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

        {/* Idempotency & Message Contracts */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Technical Telemetry</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] font-mono">X-IDEMPOTENCY-KEY:</span>
                <div className="p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-400 break-all border border-slate-800 mt-0.5">
                  {order.idempotencyKey || 'None'}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-mono">TRANSACTION ID:</span>
                <div className="p-2 bg-slate-950 rounded-lg font-mono text-[11px] text-indigo-400 break-all border border-slate-800 mt-0.5">
                  {order.id}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] font-mono">PAYMENT GATEWAY:</span>
                <span className="font-mono text-white text-xs">{order.paymentMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
