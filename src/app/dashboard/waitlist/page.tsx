'use client';

import { motion } from 'framer-motion';
import { Users, UserPlus, Star, Clock } from 'lucide-react';

export default function WaitlistPage() {
  const mockWaitlist = [
    { id: 1, name: "Jessica Day", service: "Teeth Whitening", added: "2 days ago", priority: 98, prefs: "Mornings, Mon-Wed" },
    { id: 2, name: "Nick Miller", service: "Consultation", added: "5 days ago", priority: 85, prefs: "Anytime" },
    { id: 3, name: "Winston Bishop", service: "Root Canal", added: "1 week ago", priority: 72, prefs: "After 3 PM" },
    { id: 4, name: "Schmidt", service: "Routine Cleaning", added: "2 weeks ago", priority: 45, prefs: "Fridays only" },
  ];

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Smart Waitlist</h1>
          <p className="text-slate-400">Manage clients waiting for a slot. Priority is calculated automatically.</p>
        </div>
        <button className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2">
          <UserPlus className="w-4 h-4" />
          Add to Waitlist
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1">42</h3>
          <p className="text-slate-400 text-sm">Total Clients Waiting</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1">14</h3>
          <p className="text-slate-400 text-sm">Slots Filled this Month</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1 text-emerald-400">98</h3>
          <p className="text-slate-400 text-sm">Next Highest Priority Score</p>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 bg-slate-950/30 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold">Active Queue</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-950/80 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Requested Service</th>
                <th className="p-4 font-medium">Availability Preferences</th>
                <th className="p-4 font-medium">Time Waiting</th>
                <th className="p-4 font-medium text-right">Priority Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {mockWaitlist.map((w, i) => (
                <tr key={w.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4 font-bold text-white">{w.name}</td>
                  <td className="p-4 text-slate-300">{w.service}</td>
                  <td className="p-4 text-slate-400 text-sm">{w.prefs}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-slate-400 text-sm"><Clock className="w-3 h-3"/> {w.added}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center justify-end gap-1 font-bold ${
                      i === 0 ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {i === 0 && <Star className="w-4 h-4 fill-emerald-400" />}
                      {w.priority}
                    </span>
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
