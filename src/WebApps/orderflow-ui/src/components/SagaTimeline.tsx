import React from 'react';
import type { Order } from '../types';
import { CheckCircle2, XCircle, Clock, ShieldCheck, Database, CreditCard, RotateCcw, Mail } from 'lucide-react';

interface SagaTimelineProps {
  order: Order | null;
}

export const SagaTimeline: React.FC<SagaTimelineProps> = ({ order }) => {
  if (!order) {
    return (
      <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm text-center py-10">
        <p className="text-xs text-gray-500">
          Chọn một đơn hàng ở cột bên phải để theo dõi sơ đồ vòng đời <strong className="text-gray-400">Distributed Saga</strong>.
        </p>
      </div>
    );
  }

  const isPaid = order.status === 'Paid';
  const isCancelled = order.status === 'Cancelled';
  const isPending = order.status === 'Pending';

  return (
    <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/80">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-cyan-400" />
            Saga Lifecycle Tracker — Đơn #{order.orderCode}
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Trực quan hóa luồng phối hợp phân tán giữa 4 Microservices qua RabbitMQ
          </p>
        </div>

        <span
          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold font-mono flex items-center gap-1.5 ${
            isPaid
              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              : isCancelled
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : 'bg-amber-950 text-amber-300 border border-amber-800 animate-pulse'
          }`}
        >
          {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
          {isCancelled && <XCircle className="w-3.5 h-3.5 text-rose-400" />}
          {isPending && <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
          Status: {order.status}
        </span>
      </div>

      {/* Stepper Timeline */}
      <div className="space-y-4">
        {/* Step 1: Order Created & Idempotency */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-700/60 flex items-center justify-center shrink-0 text-xs font-bold">
            1
          </div>
          <div className="flex-1 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Order Created & Idempotency Verified
              </span>
              <span className="text-[10px] font-mono text-emerald-400">OrderService : 5000</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Đơn hàng được ghi cùng <code className="text-cyan-300 font-mono">OutboxMessage</code> trong 1 giao dịch ACID.
              Key: <span className="text-gray-300 font-mono text-[10px]">{order.idempotencyKey || 'None'}</span>
            </p>
          </div>
        </div>

        {/* Step 2: 2-Tier Inventory Reservation */}
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-emerald-900/60 text-emerald-400 border border-emerald-700/60 flex items-center justify-center shrink-0 text-xs font-bold">
            2
          </div>
          <div className="flex-1 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" /> 2-Tier Stock Reservation
              </span>
              <span className="text-[10px] font-mono text-indigo-400">InventoryService : 5002</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Redis Lua Script trừ kho nhanh + PostgreSQL Conditional Update giữ chỗ với TTL 15 phút.
            </p>
          </div>
        </div>

        {/* Step 3: Payment Gateway */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
              isPaid
                ? 'bg-emerald-900/60 text-emerald-400 border-emerald-700/60'
                : isCancelled
                ? 'bg-rose-900/60 text-rose-400 border-rose-700/60'
                : 'bg-amber-900/60 text-amber-400 border-amber-700/60 animate-pulse'
            }`}
          >
            3
          </div>
          <div className="flex-1 bg-gray-950/60 p-3 rounded-xl border border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Payment Gateway Settlement
              </span>
              <span className="text-[10px] font-mono text-emerald-400">PaymentService : 5004</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Phương thức: <span className="font-mono text-white">{order.paymentMethod}</span> • Số tiền:{' '}
              <span className="font-mono text-emerald-300 font-bold">{order.totalAmount.toLocaleString('vi-VN')} đ</span>
            </p>
          </div>
        </div>

        {/* Step 4: Saga Resolution */}
        <div className="flex items-start gap-3">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border ${
              isPaid
                ? 'bg-emerald-500 text-white border-emerald-400'
                : isCancelled
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-gray-800 text-gray-400 border-gray-700'
            }`}
          >
            4
          </div>
          <div
            className={`flex-1 p-3 rounded-xl border ${
              isPaid
                ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
                : isCancelled
                ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                : 'bg-gray-950/60 border-gray-800 text-gray-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                {isPaid && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                {isCancelled && <XCircle className="w-4 h-4 text-rose-400" />}
                {isPending && <Clock className="w-4 h-4 text-amber-400 animate-spin" />}
                {isPaid
                  ? 'Saga Succeeded: Stock Committed & Paid'
                  : isCancelled
                  ? 'Saga Compensated: Stock Restored & Cancelled'
                  : 'Saga in-progress...'}
              </span>
              <span className="text-[10px] font-mono flex items-center gap-1">
                <Mail className="w-3 h-3 text-cyan-400" /> Mailpit Notification
              </span>
            </div>

            {isCancelled && order.failureReason && (
              <div className="mt-2 p-2 rounded-lg bg-rose-900/40 text-[11px] text-rose-300 border border-rose-800">
                <strong>Hành động Bù trừ (Compensation):</strong> {order.failureReason}. Tồn kho đã được hoàn trả lại cả trên Redis và PostgreSQL!
              </div>
            )}

            {isPaid && (
              <p className="text-[11px] text-emerald-300 mt-1">
                Tồn kho đã được trừ vĩnh viễn khỏi <code>TotalQuantity</code>. Email xác nhận đơn hàng đã được gửi tới Mailpit (Port 8025).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
