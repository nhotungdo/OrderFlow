import React, { useState } from 'react';
import type { Order } from '../types';
import { CheckCircle2, XCircle, Clock, Layers, ChevronRight, AlertTriangle } from 'lucide-react';

interface OrderHistoryProps {
  orders: Order[];
  selectedOrder: Order | null;
  onSelectOrder: (order: Order) => void;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  orders,
  selectedOrder,
  onSelectOrder,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'Paid' | 'Cancelled' | 'Pending'>('ALL');

  const filteredOrders = orders.filter((o) => {
    if (filter === 'ALL') return true;
    return o.status === filter;
  });

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Distributed Orders History
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Bấm vào đơn hàng để xem chi tiết & luồng Saga
          </p>
        </div>
        <span className="text-xs font-mono text-cyan-400 bg-gray-800 px-2.5 py-1 rounded-full font-bold">
          {orders.length} đơn
        </span>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-[11px]">
        {(['ALL', 'Paid', 'Cancelled', 'Pending'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer select-none ${
              filter === st
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'bg-gray-950 text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            {st === 'ALL' ? 'Tất cả' : st}
          </button>
        ))}
      </div>

      {/* Order List */}
      <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-xs">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isSelected = selectedOrder?.id === order.id;
            const isPaid = order.status === 'Paid';
            const isCancelled = order.status === 'Cancelled';
            const isPending = order.status === 'Pending';

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className={`p-3 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-gray-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                    : isPaid
                    ? 'bg-gray-950/60 border-gray-800/80 hover:border-emerald-600/50 hover:bg-gray-900/60'
                    : isCancelled
                    ? 'bg-gray-950/60 border-gray-800/80 hover:border-rose-600/50 hover:bg-gray-900/60'
                    : 'bg-gray-950/60 border-gray-800/80 hover:border-amber-600/50 hover:bg-gray-900/60'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <div>
                    <span className="font-mono text-xs font-bold text-white flex items-center gap-1">
                      {order.orderCode}
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    </span>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {new Date(order.createdAtUtc).toLocaleTimeString()} • Method: {order.paymentMethod}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                      isPaid
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : isCancelled
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                    }`}
                  >
                    {isPaid && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    {isCancelled && <XCircle className="w-3 h-3 text-rose-400" />}
                    {isPending && <Clock className="w-3 h-3 text-amber-400 animate-spin" />}
                    {order.status}
                  </span>
                </div>

                <div className="space-y-0.5 mb-1.5">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-[11px] text-gray-300">
                      <span className="truncate max-w-[190px]">
                        {it.productName} <span className="text-gray-500">x{it.quantity}</span>
                      </span>
                      <span className="font-mono text-gray-400">
                        {it.totalPrice.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>

                {order.failureReason && (
                  <div className="bg-rose-950/50 p-1.5 rounded-lg border border-rose-900/50 text-[10px] text-rose-300 flex items-start gap-1 my-1">
                    <AlertTriangle className="w-3 h-3 shrink-0 text-rose-400 mt-0.5" />
                    <span className="line-clamp-2">{order.failureReason}</span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-1.5 border-t border-gray-800/80 text-[11px]">
                  <span className="text-gray-500 font-mono text-[9px] truncate max-w-[140px]">
                    Key: {order.idempotencyKey || 'None'}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
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
