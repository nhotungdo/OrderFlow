import React, { useState } from 'react';
import type { Product } from '../types';
import { ordersApi } from '../api/client';
import { Flame, CheckCircle, XCircle, Zap, ShieldAlert } from 'lucide-react';

interface ChaosLabProps {
  products: Product[];
  onRefreshAll: () => Promise<void>;
}

export const ChaosLab: React.FC<ChaosLabProps> = ({ products, onRefreshAll }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{
    type: 'concurrency' | 'idempotency';
    totalSent: number;
    succeeded: number;
    rejected: number;
    details: { index: number; status: number; message: string }[];
  } | null>(null);

  // Kịch bản 1: Gửi đồng thời 15 requests mua sản phẩm có tồn kho hạn chế
  const runRaceConditionTest = async () => {
    if (products.length === 0) return;
    const targetProduct = products[0]; // Mặc định là iPhone 16 Pro Max
    setIsRunning(true);
    setTestResults(null);

    const burstCount = 15;
    const promises = Array.from({ length: burstCount }, async (_, idx) => {
      const uniqueKey = crypto.randomUUID();
      const payload = {
        customerId: crypto.randomUUID(),
        paymentMethod: 'STANDARD',
        items: [
          {
            productId: targetProduct.id,
            productName: targetProduct.productName,
            unitPrice: targetProduct.unitPrice,
            quantity: 1,
          },
        ],
      };

      try {
        const res = await ordersApi.createOrder(payload, uniqueKey);
        return { index: idx + 1, status: 201, message: `Thành công (Mã đơn: ${res.orderCode})` };
      } catch (err: any) {
        const status = err.response?.status || 500;
        const msg = err.response?.data?.error || err.response?.data?.message || 'Out of Stock';
        return { index: idx + 1, status, message: `Từ chối (${msg})` };
      }
    });

    const results = await Promise.all(promises);
    const succeeded = results.filter((r) => r.status === 201).length;
    const rejected = results.length - succeeded;

    setTestResults({
      type: 'concurrency',
      totalSent: burstCount,
      succeeded,
      rejected,
      details: results,
    });

    setIsRunning(false);
    await onRefreshAll();
  };

  // Kịch bản 2: Gửi đồng thời 10 requests cùng 1 Idempotency Key
  const runIdempotencySpamTest = async () => {
    if (products.length === 0) return;
    const targetProduct = products[0];
    setIsRunning(true);
    setTestResults(null);

    const fixedKey = `spam-test-${crypto.randomUUID().slice(0, 8)}`;
    const burstCount = 10;

    const payload = {
      customerId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      paymentMethod: 'STANDARD',
      items: [
        {
          productId: targetProduct.id,
          productName: targetProduct.productName,
          unitPrice: targetProduct.unitPrice,
          quantity: 1,
        },
      ],
    };

    const promises = Array.from({ length: burstCount }, async (_, idx) => {
      try {
        const res = await ordersApi.createOrder(payload, fixedKey);
        return { index: idx + 1, status: 201, message: `Đơn hợp lệ tạo mới (Mã: ${res.orderCode})` };
      } catch (err: any) {
        const status = err.response?.status || 500;
        const msg = err.response?.data?.error || 'Chặn trùng bởi Redis Lock';
        return { index: idx + 1, status, message: `Bị chặn trùng (HTTP ${status} - ${msg})` };
      }
    });

    const results = await Promise.all(promises);
    const succeeded = results.filter((r) => r.status === 201 || r.status === 200).length;
    const rejected = results.length - succeeded;

    setTestResults({
      type: 'idempotency',
      totalSent: burstCount,
      succeeded,
      rejected,
      details: results,
    });

    setIsRunning(false);
    await onRefreshAll();
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="mb-5 pb-3 border-b border-gray-800">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500 animate-bounce" />
          Chaos & Concurrency Lab — Bắn Tải Trực Tiếp Từ Trình Duyệt
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Kích hoạt hàng chục yêu cầu đồng thời (Concurrent Bursts) để chứng minh tính bất biến của hệ thống:
          <strong> Zero Overselling</strong> và <strong>Strict Idempotency</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Test 1: Race Condition */}
        <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
                <Zap className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">Test 1: 15-Request Race Condition</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Gửi đồng thời <strong>15 requests</strong> tranh chấp mua sản phẩm cùng lúc. Hệ thống sẽ giữ chỗ tức thì qua
              Redis Lua và chốt đơn bằng Postgres Atomic Update. Khi hết hàng, các request sau bị từ chối khéo léo (HTTP 409).
            </p>
          </div>

          <button
            onClick={runRaceConditionTest}
            disabled={isRunning || products.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Đang kích hoạt tải...' : 'Bắn 15 Requests Tranh Mua Cùng Lúc'}
          </button>
        </div>

        {/* Test 2: Idempotency Spam */}
        <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-semibold text-white">Test 2: 10-Spam Cùng 1 Idempotency Key</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Gửi đồng thời <strong>10 requests</strong> mang cùng 1 <code>X-Idempotency-Key</code>. Redis In-Flight Lock
              sẽ chặn 9 requests đúp ngay trong microsecond đầu tiên, bảo đảm chỉ có đúng 1 đơn hàng được tạo!
            </p>
          </div>

          <button
            onClick={runIdempotencySpamTest}
            disabled={isRunning || products.length === 0}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition cursor-pointer disabled:opacity-50"
          >
            {isRunning ? 'Đang spam...' : 'Bắn 10 Requests Cùng 1 Idempotency Key'}
          </button>
        </div>
      </div>

      {/* Hiển thị kết quả Test */}
      {testResults && (
        <div className="p-4 rounded-xl bg-gray-950/90 border border-gray-800">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-800">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Kết quả Đo kiểm Stress Test ({testResults.type.toUpperCase()})
            </h4>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle className="w-3.5 h-3.5" /> Thành công: {testResults.succeeded}
              </span>
              <span className="text-rose-400 flex items-center gap-1 font-bold">
                <XCircle className="w-3.5 h-3.5" /> Bị chặn/Hết hàng: {testResults.rejected}
              </span>
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {testResults.details.map((item) => (
              <div
                key={item.index}
                className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono ${
                  item.status === 201 || item.status === 200
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/50'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-900/50'
                }`}
              >
                <span>Request #{item.index}</span>
                <span className="font-semibold">HTTP {item.status}</span>
                <span className="text-[11px] truncate max-w-[280px] text-gray-400">{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
