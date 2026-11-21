import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  RefreshCw,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
} from 'lucide-react';
import type { QueueMetric } from '../../types';
import { systemApi } from '../../api/systemApi';

export const EventMonitorPage: React.FC = () => {
  const [metrics, setMetrics] = useState<QueueMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMetrics = async () => {
    try {
      const data = await systemApi.getQueueMetrics();
      setMetrics(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalReady = metrics.reduce((sum, q) => sum + q.messagesReady, 0);
  const totalConsumers = metrics.reduce((sum, q) => sum + q.consumerCount, 0);
  const totalThroughput = metrics.reduce((sum, q) => sum + q.rateIn, 0).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Event Processing & RabbitMQ Monitor
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-300 border border-amber-700/50 text-[10px] font-mono uppercase">
              Showcase 3
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            MassTransit message broker telemetry, consumer worker throughput, and queue depth health
          </p>
        </div>

        <button
          onClick={loadMetrics}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Bus Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Active Consumers</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalConsumers} Workers</div>
          <div className="text-[10px] text-slate-500 font-mono">MassTransit Hosted Services</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Global Inflow Rate</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">{totalThroughput} msg/s</div>
          <div className="text-[10px] text-slate-500">Real-time publish rate</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending Inflight Lag</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{totalReady} msgs</div>
          <div className="text-[10px] text-slate-500 font-mono">Unconsumed backlog</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>RabbitMQ Node</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">5672 OK</div>
          <div className="text-[10px] text-slate-500 font-mono">AMQP 0-9-1 Protocol</div>
        </div>
      </div>

      {/* Distributed Architecture Event Flow Topology */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Radio className="w-4 h-4 text-indigo-400" />
          <span>MassTransit Event Topology & Routing Architecture</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-indigo-400 font-bold">1. OrderCreatedEvent</div>
            <p className="text-slate-400 font-sans text-[11px]">
              Published by <strong className="text-white">OrderOutboxProcessor</strong> &rarr; Consumed by <strong className="text-white">OrderCreatedInventoryConsumer</strong>.
            </p>
            <div className="text-[10px] text-emerald-400">Guaranteed: At-Least-Once Delivery</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-blue-400 font-bold">2. StockReservedEvent</div>
            <p className="text-slate-400 font-sans text-[11px]">
              Published by <strong className="text-white">InventoryService</strong> &rarr; Consumed by <strong className="text-white">StockReservedPaymentConsumer</strong>.
            </p>
            <div className="text-[10px] text-emerald-400">Lock: Row-level atomic check</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-amber-400 font-bold">3. PaymentCompleted / Failed</div>
            <p className="text-slate-400 font-sans text-[11px]">
              Success triggers <strong className="text-white">NotificationService</strong>. Failure triggers <strong className="text-rose-400">ReleaseStockCommand</strong> compensation.
            </p>
            <div className="text-[10px] text-amber-400">Compensation: Self-healing rollback</div>
          </div>
        </div>
      </div>

      {/* Queues Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Active RabbitMQ Queues & Consumer Lag
          </div>
          <span className="text-[10px] font-mono text-slate-500">Auto-polling 2.0s</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading queue statistics...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Queue Name</th>
                  <th className="py-3 px-4">Consumers</th>
                  <th className="py-3 px-4">Messages Ready</th>
                  <th className="py-3 px-4">Unacknowledged</th>
                  <th className="py-3 px-4">Rate In</th>
                  <th className="py-3 px-4">Rate Out</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {metrics.map((q) => (
                  <tr key={q.queueName} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-bold text-white">{q.queueName}</td>
                    <td className="py-3.5 px-4 text-indigo-400 font-bold">{q.consumerCount}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-bold ${
                          q.messagesReady > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {q.messagesReady}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{q.messagesUnacknowledged}</td>
                    <td className="py-3.5 px-4 text-emerald-400 font-bold">
                      {q.rateIn > 0 ? `+${q.rateIn}/s` : '0.0/s'}
                    </td>
                    <td className="py-3.5 px-4 text-blue-400 font-bold">
                      {q.rateOut > 0 ? `-${q.rateOut}/s` : '0.0/s'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          q.status === 'Healthy'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {q.status === 'Healthy' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <AlertTriangle className="w-3 h-3" />
                        )}
                        <span>{q.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
