import React from 'react';
import { Layers, RefreshCw, Zap, Server, Shield, Sparkles } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: 'simulator' | 'chaos' | 'architecture';
  setActiveTab: (tab: 'simulator' | 'chaos' | 'architecture') => void;
  autoRefresh: boolean;
  setAutoRefresh: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  activeTab,
  setActiveTab,
  autoRefresh,
  setAutoRefresh,
}) => {
  return (
    <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50 px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 ring-1 ring-white/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-gray-950 animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
                OrderFlow
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> .NET 9 Distributed
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Distributed Order Processing • 2-Tier Concurrency • Saga Compensation
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-gray-900 rounded-xl border border-gray-800 shadow-inner">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Shop & Saga Simulator
          </button>

          <button
            onClick={() => setActiveTab('chaos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'chaos'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Chaos & Concurrency Lab
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === 'architecture'
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Telemetry & Ports
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded bg-gray-950 border-gray-800 text-cyan-600 focus:ring-0 cursor-pointer"
            />
            <span>Auto Polling (2.5s)</span>
          </label>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-200 text-xs font-medium border border-gray-800 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>
    </header>
  );
};
