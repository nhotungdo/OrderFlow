import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  ShieldAlert,
  Clock,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Send,
  Zap,
} from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ordersApi } from '../../api/ordersApi';
import { paymentsApi } from '../../api/paymentsApi';

export const CheckoutPage: React.FC = () => {
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [shippingAddress, setShippingAddress] = useState('789 Le Duan, Da Nang, Vietnam');
  const [paymentScenario, setPaymentScenario] = useState<'SUCCESS' | 'FAIL_CARD' | 'TIMEOUT'>('SUCCESS');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());
  const [simulateDoubleClick, setSimulateDoubleClick] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Submitting states & inspect responses
  const [submitting, setSubmitting] = useState(false);
  const [inspectResponses, setInspectResponses] = useState<any[]>([]);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    setIdempotencyKey(crypto.randomUUID());
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setInspectResponses([]);

    const payload = {
      customerId: user.id,
      customerName: user.name,
      shippingAddress,
      paymentMethod: paymentScenario === 'SUCCESS' ? 'VISA-4242' : paymentScenario,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.productName,
        unitPrice: item.product.unitPrice,
        quantity: item.quantity,
      })),
    };

    try {
      if (simulateDoubleClick) {
        // Fire 2 simultaneous requests with same Idempotency-Key
        const start = performance.now();
        const results = await Promise.allSettled([
          ordersApi.createOrder(payload, idempotencyKey),
          ordersApi.createOrder(payload, idempotencyKey),
        ]);
        const latency = Math.round(performance.now() - start);

        setInspectResponses([
          {
            request: 'Request A (First Inflight)',
            status: results[0].status === 'fulfilled' ? 201 : 500,
            data: results[0].status === 'fulfilled' ? results[0].value : (results[0] as any).reason?.message,
            latency: `${latency}ms`,
          },
          {
            request: 'Request B (Simultaneous Double-Click)',
            status: results[1].status === 'fulfilled' ? 200 : 409,
            data: results[1].status === 'fulfilled' ? results[1].value : (results[1] as any).reason?.message,
            latency: `${latency}ms`,
            note: 'Idempotency Filter intercepted duplicate request!',
          },
        ]);

        const successful = results.find((r) => r.status === 'fulfilled');
        if (successful && successful.status === 'fulfilled') {
          const order = successful.value;
          // Trigger payment simulation
          await paymentsApi.simulatePayment({
            orderId: order.orderId,
            amount: subtotal,
            paymentMethod: paymentScenario === 'SUCCESS' ? 'VISA-4242' : paymentScenario,
            forceFailure: paymentScenario === 'FAIL_CARD',
            failureReason: paymentScenario === 'FAIL_CARD' ? 'Insufficient funds' : undefined,
          });

          clearCart();
          setTimeout(() => {
            navigate(`/payment-result/${order.orderId}`);
          }, 1200);
        }
      } else {
        // Normal single request
        const res = await ordersApi.createOrder(payload, idempotencyKey);
        
        // Trigger payment simulation
        await paymentsApi.simulatePayment({
          orderId: res.orderId,
          amount: subtotal,
          paymentMethod: paymentScenario === 'SUCCESS' ? 'VISA-4242' : paymentScenario,
          forceFailure: paymentScenario === 'FAIL_CARD',
          failureReason: paymentScenario === 'FAIL_CARD' ? 'Insufficient funds' : undefined,
        });

        clearCart();
        navigate(`/payment-result/${res.orderId}`);
      }
    } catch (err: any) {
      alert(`Order creation failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Checkout & Place Order</h1>
        <p className="text-xs text-slate-400 mt-1">
          Demonstrate strict idempotency and resilient distributed transactions
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Payment Scenarios */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
              1. Customer & Delivery Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Customer</label>
                <input
                  type="text"
                  disabled
                  value={user.name}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                <input
                  type="text"
                  disabled
                  value={user.email}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Shipping Destination
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment Scenario Selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">
                2. Payment Scenario Simulator
              </h2>
              <span className="text-[10px] text-indigo-400 font-mono">MassTransit Saga Gateway</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Success */}
              <label
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  paymentScenario === 'SUCCESS'
                    ? 'bg-blue-600/20 border-blue-500 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <input
                    type="radio"
                    name="scenario"
                    checked={paymentScenario === 'SUCCESS'}
                    onChange={() => setPaymentScenario('SUCCESS')}
                    className="accent-blue-500"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-white">VISA-4242 (Success)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Order moves to Paid; Email sent via Mailpit.
                  </p>
                </div>
              </label>

              {/* Option 2: Failed */}
              <label
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  paymentScenario === 'FAIL_CARD'
                    ? 'bg-rose-600/20 border-rose-500 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <input
                    type="radio"
                    name="scenario"
                    checked={paymentScenario === 'FAIL_CARD'}
                    onChange={() => setPaymentScenario('FAIL_CARD')}
                    className="accent-rose-500"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-rose-300">FAIL_CARD (Rollback)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Triggers Saga Compensation to unreserve stock.
                  </p>
                </div>
              </label>

              {/* Option 3: Timeout */}
              <label
                className={`p-4 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                  paymentScenario === 'TIMEOUT'
                    ? 'bg-amber-600/20 border-amber-500 text-white'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <input
                    type="radio"
                    name="scenario"
                    checked={paymentScenario === 'TIMEOUT'}
                    onChange={() => setPaymentScenario('TIMEOUT')}
                    className="accent-amber-500"
                  />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-300">TIMEOUT (DLQ)</div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Simulates connection drop, retries & DLQ.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Idempotency Key Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>3. Distributed Idempotency Key</span>
              </h2>
              <span className="text-[10px] text-emerald-400 font-mono">Header: X-Idempotency-Key</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleCopyKey}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Copy Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleRegenerateKey}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                title="Generate New UUID v4"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Double click toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateDoubleClick}
                  onChange={(e) => setSimulateDoubleClick(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Simulate Concurrent Double-Click Spam (Promise.all)
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Fires 2 simultaneous HTTP POSTs with identical Idempotency-Key to prove database deduplication.
                  </span>
                </div>
              </label>
            </div>

            {/* Inspect responses if double click ran */}
            {inspectResponses.length > 0 && (
              <div className="p-3 bg-slate-950 rounded-xl border border-indigo-900/50 space-y-2">
                <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wide">
                  Concurrent Execution Telemetry:
                </div>
                {inspectResponses.map((res, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded-lg text-xs font-mono space-y-1">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold">{res.request}</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px]">
                        HTTP {res.status} ({res.latency})
                      </span>
                    </div>
                    {res.note && <div className="text-[11px] text-emerald-400">{res.note}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 sticky top-24">
            <h2 className="text-base font-bold text-white tracking-tight border-b border-slate-800 pb-3">
              Items in Order ({cart.length})
            </h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between text-xs">
                  <div>
                    <div className="font-medium text-slate-200 line-clamp-1">{item.product.productName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.quantity} × ${item.product.unitPrice}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white">
                    ${(item.quantity * item.product.unitPrice).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-white font-semibold">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="font-mono text-emerald-400 font-semibold">$0.00</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-sm">
                <span className="font-bold text-white">Total Amount</span>
                <span className="font-black text-blue-400 font-mono text-base">
                  ${subtotal.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-xl shadow-blue-600/30"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Saga Transaction...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Place Order with Idempotency</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
