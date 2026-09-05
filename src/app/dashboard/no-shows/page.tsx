'use client';

import { motion } from 'framer-motion';
import { CalendarX2, RefreshCw, AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function NoShowsPage() {
  const [isSyncing, setIsSyncing] = useState(false);

  const mockCases = [
    {
      id: "case_1",
      client: "Sarah Jenkins",
      service: "Teeth Whitening ($150)",
      originalTime: "Today, 10:00 AM",
      status: "RECOVERED",
      step: "Rebooked for Tomorrow",
    },
    {
      id: "case_2",
      client: "Michael Scott",
      service: "Root Canal ($800)",
      originalTime: "Today, 09:00 AM",
      status: "CALLING_WAITLIST",
      step: "Calling Waitlist #2",
    },
    {
      id: "case_3",
      client: "Emma Watson",
      service: "Routine Cleaning ($95)",
      originalTime: "Yesterday, 04:30 PM",
      status: "RECOVERED",
      step: "Slot filled by Waitlist",
    },
    {
      id: "case_4",
      client: "John Doe",
      service: "Consultation ($50)",
      originalTime: "Yesterday, 01:00 PM",
      status: "FAILED",
      step: "Waitlist Exhausted",
    }
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
    } catch (err) {
      console.error('Calendar sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'RECOVERED': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> Recovered</span>;
      case 'CALLING_WAITLIST': return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><Clock className="w-3 h-3 animate-spin-slow"/> Cascade Active</span>;
      case 'FAILED': return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3"/> Unrecovered</span>;
      default: return null;
    }
  };

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

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Original Appointment</th>
                <th className="p-4 font-medium">Missed Service</th>
                <th className="p-4 font-medium">Cascade Status</th>
                <th className="p-4 font-medium">Current Action</th>
                <th className="p-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {mockCases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/20 transition-colors group cursor-pointer">
                  <td className="p-4">
                    <div className="font-bold text-white">{c.client}</div>
                    <div className="text-xs text-slate-500">{c.originalTime}</div>
                  </td>
                  <td className="p-4 text-slate-300">{c.service}</td>
                  <td className="p-4">{getStatusBadge(c.status)}</td>
                  <td className="p-4 text-sm text-slate-400">{c.step}</td>
                  <td className="p-4 text-right">
                    <button className="p-2 rounded-lg bg-slate-800/0 group-hover:bg-slate-800 text-slate-500 group-hover:text-slate-300 transition-all">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
