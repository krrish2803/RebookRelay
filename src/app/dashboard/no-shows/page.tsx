'use client';

import { motion } from 'framer-motion';
import { CalendarX2, RefreshCw, AlertCircle, Clock, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function NoShowsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [cases, setCases] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, recovered: 0, inProgress: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = () => {
    fetch('/api/dashboard/no-shows')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setCases(data.data.cases);
          setStats(data.data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
      fetchCases();
    } catch (err) {
      console.error('Calendar sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Completed</span>;
      case 'PENDING_CALL_1': case 'PENDING_CALL_2': case 'PENDING_CALL_3': return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3 animate-pulse"/> Cascade Active</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-3 py-1 rounded-full text-xs font-medium w-fit">{status}</span>;
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">No-Show Recovery</h1>
          <p className="text-slate-400">Track missed appointments and live AI recovery attempts.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2 disabled:opacity-70"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Force Calendar Sync
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/50 border border-slate-800/50 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1">{stats.total}</h3>
          <p className="text-slate-400 text-sm">Total Cases</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-emerald-400">{stats.recovered}</h3>
          <p className="text-slate-400 text-sm">Recovered</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-amber-400">{stats.inProgress}</h3>
          <p className="text-slate-400 text-sm">In Progress</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-rose-500/5 border border-rose-500/20 p-5 rounded-2xl">
          <h3 className="text-2xl font-black mb-1 text-rose-400">{stats.failed}</h3>
          <p className="text-slate-400 text-sm">Unrecovered</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-950/30">
          <h2 className="font-bold flex items-center gap-2">
            <CalendarX2 className="w-5 h-5 text-indigo-400" /> Detected Incidents
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : cases.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No no-shows detected yet. Connect Google Calendar and sync to detect missed appointments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Original Appointment</th>
                  <th className="p-4 font-medium">Missed Service</th>
                  <th className="p-4 font-medium">Cascade Status</th>
                  <th className="p-4 font-medium">Calls Made</th>
                  <th className="p-4 font-medium">Revenue</th>
                  <th className="p-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {cases.map((c) => (
                  <motion.tr key={c.id} layout className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{c.client}</div>
                      <div className="text-xs text-slate-500">{formatTime(c.originalTime)}</div>
                    </td>
                    <td className="p-4 text-slate-300">{c.service}</td>
                    <td className="p-4">{getStatusBadge(c.status)}</td>
                    <td className="p-4 text-sm text-slate-400">{c.callAttempts.length}</td>
                    <td className="p-4 text-sm font-medium text-emerald-400">
                      {c.revenueRecovered ? `$${c.revenueRecovered}` : '--'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => setExpandedCase(expandedCase === c.id ? null : c.id)}
                        className="p-2 rounded-lg bg-slate-800/0 hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-all"
                      >
                        {expandedCase === c.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {cases.map((c) => expandedCase === c.id && (
              <motion.div key={`detail-${c.id}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-t border-slate-800/50 bg-slate-950/30 p-6">
                <h4 className="font-bold text-sm mb-3 text-slate-300">Call History</h4>
                {c.callAttempts.length === 0 ? (
                  <p className="text-slate-500 text-sm">No calls made yet.</p>
                ) : (
                  <div className="space-y-2">
                    {c.callAttempts.map((a: any) => (
                      <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-xl">
                        <span className="text-xs font-bold text-slate-500">#{a.callSequence}</span>
                        <span className="text-sm text-white font-medium">{a.target}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          a.outcome === 'BOOKED' ? 'bg-emerald-500/10 text-emerald-400' :
                          a.outcome === 'DECLINED' ? 'bg-rose-500/10 text-rose-400' :
                          'bg-slate-500/10 text-slate-400'
                        }`}>{a.outcome}</span>
                        <span className="text-xs text-slate-500 ml-auto">{formatTime(a.initiatedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
