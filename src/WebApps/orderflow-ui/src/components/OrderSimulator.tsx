import React, { useState } from 'react';
import type { Product } from '../types';
import { ShieldCheck, Send, Zap } from 'lucide-react';

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
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Order & Saga Simulator
        </h2>
        <p className="text-xs text-gray-400">
          Thử nghiệm chống tạo đơn trùng (Idempotency) & xử lý lỗi thanh toán (Saga Compensation)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selected Product info */}
        <div className="bg-gray-800/50 p-3.5 rounded-xl border border-gray-800">
          <span className="text-[11px] text-gray-400 block mb-1">Sản phẩm đang chọn:</span>
          {selectedProduct ? (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-white">{selectedProduct.productName}</p>
                <p className="text-[10px] text-gray-400">SKU: {selectedProduct.sku} • Tồn kho: {selectedProduct.availableQuantity}</p>
              </div>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {selectedProduct.unitPrice.toLocaleString('vi-VN')} đ
              </span>
            </div>
          ) : (
            <p className="text-xs text-amber-400 italic">Vui lòng chọn 1 sản phẩm ở bảng bên trái để tiếp tục.</p>
          )}
        </div>

        {/* Idempotency Key Section */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium text-gray-300 flex items-center gap-1.5">
              <span>X-Idempotency-Key (UUID)</span>
            </label>
            <button
              type="button"
              onClick={generateNewKey}
              className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3" /> Sinh Key Mới
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            Gửi cùng Key nhiều lần sẽ được hệ thống chặn trùng hoặc trả lại kết quả cũ mà không tạo đơn mới.
          </p>
        </div>

        {/* Payment Scenarios */}
        <div>
          <label className="text-xs font-medium text-gray-300 block mb-2">
            Kịch bản Thanh toán (Saga Test):
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('STANDARD')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'STANDARD'
                  ? 'bg-emerald-950/40 border-emerald-500 text-white'
                  : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <div className="text-xs font-semibold text-emerald-400">Thành công</div>
              <div className="text-[10px] text-gray-400 mt-0.5">VietQR / Valid Card</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('FAIL_CARD')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'FAIL_CARD'
                  ? 'bg-rose-950/40 border-rose-500 text-white'
                  : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <div className="text-xs font-semibold text-rose-400">Lỗi Thẻ</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Bank Declined (Hoàn kho)</div>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('TIMEOUT')}
              className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                paymentMethod === 'TIMEOUT'
                  ? 'bg-amber-950/40 border-amber-500 text-white'
                  : 'bg-gray-800/40 border-gray-800 text-gray-400 hover:bg-gray-800'
              }`}
            >
              <div className="text-xs font-semibold text-amber-400">Timeout</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Gateway 504 (Hoàn kho)</div>
            </button>
          </div>
        </div>

        {/* Double-click test checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="doubleClick"
            checked={enableDoubleClick}
            onChange={(e) => setEnableDoubleClick(e.target.checked)}
            className="rounded bg-gray-950 border-gray-800 text-cyan-600 focus:ring-0 cursor-pointer"
          />
          <label htmlFor="doubleClick" className="text-xs text-gray-300 cursor-pointer select-none">
            Giả lập <span className="text-cyan-400 font-semibold">Bấm Đúp Đồng Thời (2 requests cùng lúc)</span> để test Redis Lock
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={!selectedProduct || isLoading}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Đang gửi yêu cầu...
            </div>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Thực hiện Đặt Hàng Phân Tán
            </>
          )}
        </button>
      </form>

      {/* Response Display */}
      {lastResponse && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
              Kết quả phản hồi (Response):
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                lastResponse.status === 200 || lastResponse.status === 201
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                  : 'bg-rose-950 text-rose-400 border border-rose-800/50'
              }`}
            >
              HTTP {lastResponse.status}
            </span>
          </div>
          <pre className="p-3 rounded-lg bg-gray-950 text-[11px] font-mono text-gray-300 overflow-x-auto border border-gray-800/80 max-h-48">
            {JSON.stringify(lastResponse.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
