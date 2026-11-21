import React, { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, RefreshCw, FileText } from 'lucide-react';
import type { StockMovement } from '../../types';
import { inventoryApi } from '../../api/inventoryApi';

export const StockMovementPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [search, setSearch] = useState('');

  const loadMovements = async () => {
    try {
      const data = await inventoryApi.getStockMovements();
      setMovements(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const types = ['All', 'RESTOCK', 'HOLD', 'RELEASE', 'DEDUCT'];

  const filtered = movements.filter((m) => {
    const matchType = typeFilter === 'All' || m.movementType === typeFilter;
    const matchSearch =
      m.sku.toLowerCase().includes(search.toLowerCase()) ||
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      (m.referenceOrderId && m.referenceOrderId.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Stock Movement & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable ledger tracking all inventory state transitions (Inbound, Saga Holds, Deductions, and Compensations)
          </p>
        </div>

        <button
          onClick={loadMovements}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by SKU, Order ID, or Product..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition shrink-0 ${
                typeFilter === t
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading stock movements...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center bg-slate-900/50 rounded-2xl border border-slate-800">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No stock movement logs found.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/70 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">SKU / Item</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4">Quantity Delta</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Reference Order</th>
                  <th className="py-3 px-4">Audit Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filtered.map((m) => {
                  const isPositive = m.quantityChange > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-850/50 transition">
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(m.timestampUtc).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white font-sans">{m.productName}</div>
                        <div className="text-[10px] text-slate-500">{m.sku}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            m.movementType === 'RESTOCK'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : m.movementType === 'HOLD'
                              ? 'bg-amber-950 text-amber-400 border border-amber-800'
                              : m.movementType === 'DEDUCT'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          <span>{m.movementType}</span>
                        </span>
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold ${
                          isPositive ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPositive ? `+${m.quantityChange}` : m.quantityChange}
                      </td>
                      <td className="py-3.5 px-4 text-white font-bold">{m.balanceAfter}</td>
                      <td className="py-3.5 px-4 text-indigo-400">
                        {m.referenceOrderId || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-400 text-[11px]">
                        {m.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
