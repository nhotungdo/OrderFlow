import React from 'react';
import type { Order } from '../types';
import { CheckCircle2, XCircle, Clock, AlertTriangle, Layers } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ orders }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Distributed Orders History
          </h2>
          <p className="text-xs text-gray-400">
            Trạng thái xử lý cập nhật tự động (Auto-refresh mỗi 2 giây)
          </p>
        </div>
        <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2.5 py-1 rounded-full">
          Total: {orders.length}
        </span>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-xs">
            Chưa có đơn hàng nào được tạo. Hãy tạo đơn đầu tiên từ bảng mô phỏng!
          </div>
        ) : (
          orders.map((order) => {
            const isPaid = order.status === 'Paid';
            const isCancelled = order.status === 'Cancelled';
            const isPending = order.status === 'Pending';

            return (
              <div
                key={order.id}
                className={`p-3.5 rounded-xl border transition ${
                  isPaid
                    ? 'bg-emerald-950/20 border-emerald-900/40'
                    : isCancelled
                    ? 'bg-rose-950/20 border-rose-900/40'
                    : 'bg-amber-950/20 border-amber-900/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-white">
                      {order.orderCode}
                    </span>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {new Date(order.createdAtUtc).toLocaleTimeString()} • Method: {order.paymentMethod}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono ${
                      isPaid
                        ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                        : isCancelled
                        ? 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                        : 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                    }`}
                  >
                    {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isCancelled && <XCircle className="w-3 h-3 text-rose-400" />}
                    {isPending && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                    {order.status}
                  </span>
                </div>

                <div className="text-xs text-gray-300 mb-2">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-[11px] py-0.5">
                      <span className="text-gray-300">
                        {it.productName} <span className="text-gray-500">x{it.quantity}</span>
                      </span>
                      <span className="font-mono text-gray-400">
                        {it.totalPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                {order.failureReason && (
                  <div className="bg-rose-950/60 p-2 rounded-lg border border-rose-800/50 text-[10px] text-rose-300 flex items-start gap-1.5 mb-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span>Lý do hủy: {order.failureReason} (Đã hoàn kho)</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t border-gray-800/80 text-[11px]">
                  <span className="text-gray-400 font-mono text-[10px] truncate max-w-[180px]">
                    Key: {order.idempotencyKey || 'None'}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {order.totalAmount.toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
