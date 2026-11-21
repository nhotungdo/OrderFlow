import React, { useState } from 'react';
import type { Product } from '../types';
import { ShieldCheck, Send, Zap, CreditCard, AlertOctagon, Clock, Layers } from 'lucide-react';

interface OrderSimulatorProps {
  selectedProduct: Product | null;
  onCreateOrder: (params: {
    product: Product;
    paymentMethod: string;
    idempotencyKey: string;
    doubleClickTest: boolean;
  }) => Promise<void>;
  isLoading: boolean;
  lastResponse: any;
}

export const OrderSimulator: React.FC<OrderSimulatorProps> = ({
  selectedProduct,
  onCreateOrder,
  isLoading,
  lastResponse,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'STANDARD' | 'FAIL_CARD' | 'TIMEOUT'>('STANDARD');
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID());
  const [enableDoubleClick, setEnableDoubleClick] = useState<boolean>(false);

  const generateNewKey = () => setIdempotencyKey(crypto.randomUUID());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    await onCreateOrder({
      product: selectedProduct,
      paymentMethod,
      idempotencyKey,
      doubleClickTest: enableDoubleClick,
    });
  };

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="mb-4 pb-3 border-b border-gray-800/80">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Order & Saga Simulator
        </h2>
        <p className="text-[11px] text-gray-400 mt-0.5">
          Khởi tạo đơn hàng có bảo vệ <strong>Idempotency</strong> & kiểm thử bù trừ <strong>Saga Compensation</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sản phẩm đang chọn */}
        <div className="bg-gray-950/60 p-3.5 rounded-xl border border-gray-800">
          <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400 block mb-1">
            Sản phẩm được chọn đặt hàng:
          </span>
          {selectedProduct ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-white">{selectedProduct.productName}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  SKU: <span className="font-mono text-cyan-400">{selectedProduct.sku}</span> • Khả dụng: {selectedProduct.availableQuantity}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {selectedProduct.unitPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          ) : (
            <p className="text-xs text-amber-400 italic">Vui lòng chọn 1 sản phẩm ở bảng danh mục.</p>
          )}
        </div>

        {/* Cấu hình X-Idempotency-Key */}
        <div className="bg-gray-950/60 p-3.5 rounded-xl border border-gray-800">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>X-Idempotency-Key (UUID)</span>
            </label>
            <button
              type="button"
              onClick={generateNewKey}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition"
            >
              <Zap className="w-3 h-3" /> Sinh Key Mới
            </button>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
          />
          <p className="text-[10px] text-gray-400 mt-1.5">
            🛡️ Cơ chế 2 tầng: Redis chặn duplicate trong 60s, Postgres trả kết quả cũ cho các lần gọi sau.
          </p>
        </div>

        {/* Kịch bản Thanh toán (Saga Test) */}
        <div>
          <label className="text-xs font-medium text-gray-300 block mb-2">
            Chọn kịch bản thanh toán (Distributed Saga Test):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('STANDARD')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'STANDARD'
                  ? 'bg-emerald-950/50 border-emerald-500 text-white shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : 'bg-gray-950/50 border-gray-800 text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                <CreditCard className="w-3.5 h-3.5" /> Thành công
              </div>
              <div className="text-[10px] text-gray-400 mt-1">VietQR / Thẻ hợp lệ (Settle đơn)</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('FAIL_CARD')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'FAIL_CARD'
                  ? 'bg-rose-950/50 border-rose-500 text-white shadow-md shadow-rose-950/30 ring-1 ring-rose-500/40'
                  : 'bg-gray-950/50 border-gray-800 text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                <AlertOctagon className="w-3.5 h-3.5" /> Lỗi Thẻ
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Declined (Hoàn kho tự động)</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('TIMEOUT')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'TIMEOUT'
                  ? 'bg-amber-950/50 border-amber-500 text-white shadow-md shadow-amber-950/30 ring-1 ring-amber-500/40'
                  : 'bg-gray-950/50 border-gray-800 text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                <Clock className="w-3.5 h-3.5" /> Timeout
              </div>
              <div className="text-[10px] text-gray-400 mt-1">504 Gateway (Hoàn kho tự động)</div>
            </button>
          </div>
        </div>

        {/* Checkbox Double-Click Test */}
        <div className="bg-gray-950/60 p-3 rounded-xl border border-gray-800 flex items-center gap-2.5">
          <input
            type="checkbox"
            id="doubleClick"
            checked={enableDoubleClick}
            onChange={(e) => setEnableDoubleClick(e.target.checked)}
            className="rounded bg-gray-900 border-gray-700 text-cyan-600 focus:ring-0 cursor-pointer w-4 h-4"
          />
          <label htmlFor="doubleClick" className="text-xs text-gray-300 cursor-pointer select-none leading-relaxed">
            Giả lập <strong className="text-cyan-400">Bấm Đúp Đồng Thời (2 requests cùng ms)</strong> để test cơ chế Redis In-flight Lock
          </label>
        </div>

        {/* Nút gửi đơn */}
        <button
          type="submit"
          disabled={!selectedProduct || isLoading || selectedProduct.availableQuantity <= 0}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Đang phân tán xử lý đơn...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Gửi Đơn Hàng Phân Tán
            </>
          )}
        </button>
      </form>

      {/* Hiển thị kết quả phản hồi HTTP */}
      {lastResponse && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
              Kết quả HTTP Response:
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                lastResponse.status === 200 || lastResponse.status === 201
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/50'
              }`}
            >
              {typeof lastResponse.status === 'number' ? `HTTP ${lastResponse.status}` : lastResponse.status}
            </span>
          </div>
          <pre className="p-3 rounded-lg bg-gray-950 text-[11px] font-mono text-gray-300 overflow-x-auto border border-gray-800/80 max-h-44">
            {JSON.stringify(lastResponse.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
