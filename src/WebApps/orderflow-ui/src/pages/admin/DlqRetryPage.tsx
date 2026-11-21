import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Trash2,
  FileText,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import type { DlqMessage } from '../../types';
import { systemApi } from '../../api/systemApi';

export const DlqRetryPage: React.FC = () => {
  const [messages, setMessages] = useState<DlqMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<DlqMessage | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadDlq = async () => {
    try {
      const data = await systemApi.getDlqMessages();
      setMessages(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDlq();
  }, []);

  const handleRetry = async (msg: DlqMessage) => {
    setReplayingId(msg.id);
    setActionNotice(null);
    try {
      const res = await systemApi.retryDlqMessage(msg.id);
      setActionNotice(res.message);
      await loadDlq();
      if (selectedMessage?.id === msg.id) setSelectedMessage(null);
    } finally {
      setReplayingId(null);
    }
  };

  const handlePurge = async () => {
    if (!confirm('Are you sure you want to purge all Dead-Letter Queue messages?')) return;
    const res = await systemApi.purgeDlq();
    setActionNotice(`Purged ${res.purgedCount} poison message(s) from DLQ exchange.`);
    await loadDlq();
    setSelectedMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Dead-Letter Queue (DLQ) & Safe Replay
            </h1>
            <span className="px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 border border-rose-700/50 text-[10px] font-mono uppercase">
              Showcase 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Poison message isolation, C# exception stack trace forensics, and zero-duplicate idempotent re-execution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handlePurge}
              className="px-3.5 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge DLQ</span>
            </button>
          )}
          <button
            onClick={loadDlq}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh DLQ</span>
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Architecture Concept Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Why Safe Replay Matters in Microservices (CV Key Topic)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          When an unexpected network timeout or database deadlock occurs, MassTransit retries 3 times with exponential backoff before sending to Dead-Letter Queue (`*.dlq`). When the developer fixes the bug and clicks <strong>"Replay Message"</strong>, our <strong>Idempotency Store in PostgreSQL</strong> guarantees that if a partial side-effect already completed (e.g. money was charged), it will <strong>never execute twice</strong>.
        </p>
      </div>

      {/* Messages Table & Detail Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Poison Messages in DLQ ({messages.length})
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs">Loading DLQ...</div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/50">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-slate-200 text-sm font-semibold">Zero Poison Messages in DLQ</p>
              <p className="text-slate-500 text-xs mt-1">All consumer queues are processing normally.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer transition ${
                    selectedMessage?.id === msg.id
                      ? 'bg-indigo-950/40 border-l-4 border-indigo-500'
                      : 'hover:bg-slate-850/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{msg.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-400 border border-rose-800">
                        {msg.retryCount} Retries Failed
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Queue: <strong className="text-slate-300">{msg.originalQueue}</strong>
                    </div>
                    <div className="text-rose-400 font-medium text-[11px] line-clamp-1">
                      {msg.errorMessage}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(msg);
                      }}
                      disabled={replayingId === msg.id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-sm"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${replayingId === msg.id ? 'animate-spin' : ''}`} />
                      <span>{replayingId === msg.id ? 'Replaying...' : 'Replay Message'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Message Forensic Inspector */}
        <div className="lg:col-span-1">
          {selectedMessage ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Stack Trace Forensics
                </span>
                <span className="text-[10px] font-mono text-rose-400 font-bold">
                  {selectedMessage.id}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Exception Type:
                  </span>
                  <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-rose-300 border border-slate-800 mt-1">
                    {selectedMessage.exceptionType}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    C# Exception Stack Trace:
                  </span>
                  <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-slate-400 overflow-x-auto max-h-48 border border-slate-800 mt-1 whitespace-pre-wrap">
                    {selectedMessage.stackTrace}
                  </pre>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">
                    Dead Message Payload:
                  </span>
                  <pre className="p-2.5 rounded-lg bg-black/60 font-mono text-[10px] text-emerald-400 overflow-x-auto max-h-36 border border-slate-800 mt-1">
                    {selectedMessage.payload}
                  </pre>
                </div>
              </div>

              <button
                onClick={() => handleRetry(selectedMessage)}
                disabled={replayingId === selectedMessage.id}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md shadow-indigo-600/30"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${replayingId === selectedMessage.id ? 'animate-spin' : ''}`} />
                <span>Re-Publish into Broker (Idempotent Safe)</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <span>Select any message from the list to inspect its C# Stack Trace & Payload forensics.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
