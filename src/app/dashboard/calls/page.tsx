'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, PlayCircle, FileText, CheckCircle2, XCircle, X, Mic, User, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CallLogsPage() {
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/calls')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCalls(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatDuration = (sec: number | null) => {
    if (!sec) return '--';
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  const getSentimentLabel = (score: number | null) => {
    if (score === null || score === undefined) return '--';
    if (score >= 0.7) return 'Positive';
    if (score >= 0.4) return 'Neutral';
    return 'Negative';
  };

  const getOutcomeBadge = (outcome: string) => {
    const map: Record<string, string> = {
      BOOKED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      DECLINED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      NO_ANSWER: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      ERROR: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      PENDING: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    };
    return map[outcome] || map.PENDING;
  };

  const formatTime = (d: string | null) => {
    if (!d) return '--';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">AI Call Logs</h1>
          <p className="text-slate-400">Review transcripts and recordings of CALL-E conversations.</p>
        </div>
        <span className="text-sm text-slate-400">Total calls: {calls.length}</span>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-indigo-400" /> Recent AI Calls
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : calls.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No calls yet. Trigger a cascade from the dashboard to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Call Type</th>
                  <th className="p-4 font-medium">Duration</th>
                  <th className="p-4 font-medium">Sentiment</th>
                  <th className="p-4 font-medium">Outcome</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {calls.map((call) => (
                  <tr key={call.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{call.client}</div>
                      <div className="text-xs text-slate-500">{formatTime(call.initiatedAt)}</div>
                    </td>
                    <td className="p-4 text-slate-300">{call.type}</td>
                    <td className="p-4 text-slate-400">{call.duration || '--'}</td>
                    <td className="p-4 text-slate-300">{getSentimentLabel(call.sentimentScore)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getOutcomeBadge(call.outcome)}`}>
                        {call.outcome === 'BOOKED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {call.outcome}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setSelectedCall(call)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="View Transcript">
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h3 className="font-bold text-lg text-white">Call: {selectedCall.client}</h3>
                  <p className="text-sm text-slate-400">{formatTime(selectedCall.initiatedAt)} - {selectedCall.type}</p>
                </div>
                <button onClick={() => setSelectedCall(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedCall.recordingUrl && (
                <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-4">
                  <a href={selectedCall.recordingUrl} target="_blank" rel="noopener noreferrer" className="w-12 h-12 flex items-center justify-center bg-indigo-500 rounded-full hover:bg-indigo-600 transition-colors text-white">
                    <PlayCircle className="w-6 h-6" />
                  </a>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-0 h-full bg-indigo-500 rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-slate-400">{formatDuration(selectedCall.callDurationSec)}</span>
                </div>
              )}

              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Transcript</h4>
                
                {selectedCall.transcript ? (
                  <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">{selectedCall.transcript}</div>
                ) : (
                  <div className="text-slate-500 text-sm italic">No transcript available for this call.</div>
                )}

                {selectedCall.notes && (
                  <div className="mt-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                    <h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Notes</h5>
                    <p className="text-slate-300 text-sm">{selectedCall.notes}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
