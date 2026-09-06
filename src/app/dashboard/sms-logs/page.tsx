'use client';

import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle2, XCircle, Clock, Loader2, Send } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SmsLogsPage() {
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/sms-logs')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSmsLogs(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const formatTime = (d: string | null) => {
    if (!d) return '--';
    return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const getOutcomeBadge = (outcome: string) => {
    const map: Record<string, string> = {
      DELIVERED: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
      REPLIED_YES: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      REPLIED_NO: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      FAILED: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    };
    return map[outcome] || map.DELIVERED;
  };

  const getOutcomeIcon = (outcome: string) => {
    switch (outcome) {
      case 'REPLIED_YES': return <CheckCircle2 className="w-3 h-3" />;
      case 'REPLIED_NO': return <XCircle className="w-3 h-3" />;
      case 'DELIVERED': return <Send className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">SMS Logs</h1>
          <p className="text-slate-400">Track SMS recovery attempts and patient replies.</p>
        </div>
        <span className="text-sm text-slate-400">Total SMS: {smsLogs.length}</span>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" /> SMS Recovery Attempts
          </h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : smsLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No SMS messages sent yet. The cascade workflow sends SMS first before calling.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/50 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Phone</th>
                  <th className="p-4 font-medium">Message</th>
                  <th className="p-4 font-medium">Outcome</th>
                  <th className="p-4 font-medium">Sent</th>
                  <th className="p-4 font-medium">Replied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {smsLogs.map((sms) => (
                  <tr key={sms.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{sms.client}</div>
                    </td>
                    <td className="p-4 text-slate-400 text-sm">{sms.phone}</td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300 max-w-xs truncate">{sms.messageBody}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getOutcomeBadge(sms.outcome)}`}>
                        {getOutcomeIcon(sms.outcome)}
                        {sms.outcome}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{formatTime(sms.initiatedAt)}</td>
                    <td className="p-4 text-sm text-slate-400">{formatTime(sms.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
