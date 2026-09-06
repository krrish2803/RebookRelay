'use client';

import { motion } from 'framer-motion';
import { History, PhoneCall, MessageSquare, CheckCircle2, XCircle, Clock, Loader2, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Communication {
  id: string;
  type: 'call' | 'sms' | 'confirmation';
  client: string;
  phone: string;
  direction: string;
  outcome: string;
  summary: string;
  timestamp: string;
  duration?: string;
  sentiment?: number;
}

export default function HistoryPage() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHistory = useCallback(() => {
    fetch('/api/dashboard/history')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCommunications(data.data);
        setLoading(false);
        setLastRefresh(new Date());
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchHistory, 10000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchHistory]);

  const formatTime = (d: string) => new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const getTypeIcon = (type: string, outcome: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'confirmation':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'sms': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'confirmation': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const positive = ['BOOKED', 'REPLIED_YES', 'CONFIRMED', 'DELIVERED', 'DRY_RUN'];
    const negative = ['DECLINED', 'REPLIED_NO', 'DECLINED', 'ERROR'];
    const pending = ['PENDING', 'NO_ANSWER'];

    if (positive.includes(outcome)) {
      return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-medium">{outcome}</span>;
    }
    if (negative.includes(outcome)) {
      return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-xs font-medium">{outcome}</span>;
    }
    if (pending.includes(outcome)) {
      return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3 animate-pulse" />{outcome}</span>;
    }
    return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded-full text-xs font-medium">{outcome}</span>;
  };

  const getSentimentLabel = (score: number | undefined) => {
    if (score === undefined || score === null) return null;
    if (score >= 0.7) return <span className="text-emerald-400 text-xs">Positive</span>;
    if (score >= 0.4) return <span className="text-slate-400 text-xs">Neutral</span>;
    return <span className="text-rose-400 text-xs">Negative</span>;
  };

  const stats = {
    total: communications.length,
    calls: communications.filter(c => c.type === 'call').length,
    sms: communications.filter(c => c.type === 'sms').length,
    confirmations: communications.filter(c => c.type === 'confirmation').length,
  };

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Communication History</h1>
          <p className="text-slate-400">All AI calls, SMS messages, and confirmations in one place.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-800/50 text-slate-400 border border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <span className="text-xs text-slate-500">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-slate-800/50 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1">{stats.total}</h3>
          <p className="text-slate-400 text-sm">Total Communications</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-indigo-500/5 border border-indigo-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-indigo-400">{stats.calls}</h3>
          <p className="text-slate-400 text-sm">AI Calls</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-cyan-500/5 border border-cyan-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-cyan-400">{stats.sms}</h3>
          <p className="text-slate-400 text-sm">SMS Messages</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-emerald-400">{stats.confirmations}</h3>
          <p className="text-slate-400 text-sm">Confirmations</p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-2 bg-slate-950/30">
          <History className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold">All Communications</h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : communications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No communications yet. Trigger a recovery cascade to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Summary</th>
                  <th className="p-4 font-medium">Outcome</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Sentiment</th>
                  <th className="p-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {communications.map((comm) => (
                  <motion.tr
                    key={`${comm.type}-${comm.id}`}
                    layout
                    className="hover:bg-slate-800/20 transition-colors"
                  >
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getTypeColor(comm.type)}`}>
                        {getTypeIcon(comm.type, comm.outcome)}
                        {comm.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">{comm.client}</div>
                      <div className="text-xs text-slate-500">{comm.phone}</div>
                    </td>
                    <td className="p-4 text-slate-300 text-sm">{comm.summary}</td>
                    <td className="p-4">{getOutcomeBadge(comm.outcome)}</td>
                    <td className="p-4 text-sm text-slate-400">{comm.duration || '--'}</td>
                    <td className="p-4">{getSentimentLabel(comm.sentiment)}</td>
                    <td className="p-4 text-right text-sm text-slate-500">{formatTime(comm.timestamp)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
