'use client';

import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Comparison() {
  return (
    <section className="py-32 px-6 bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-16 text-center">Why RebookRelay Wins</h2>
        
        <div className="overflow-x-auto">
          <motion.table 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full text-left border-collapse min-w-[600px]"
          >
            <thead>
              <tr>
                <th className="p-6 border-b border-slate-800 text-lg text-slate-400 font-medium">Feature</th>
                <th className="p-6 border-b border-slate-800 text-lg font-bold text-indigo-400 bg-indigo-500/5 rounded-t-2xl">RebookRelay</th>
                <th className="p-6 border-b border-slate-800 text-lg font-medium text-slate-300">SMS Reminders</th>
                <th className="p-6 border-b border-slate-800 text-lg font-medium text-slate-300">Human Staff</th>
              </tr>
            </thead>
            <tbody className="text-slate-300">
              <tr>
                <td className="p-6 border-b border-slate-800">Natural Voice Calls</td>
                <td className="p-6 border-b border-indigo-500/20 bg-indigo-500/5"><Check className="text-indigo-400" /></td>
                <td className="p-6 border-b border-slate-800"><X className="text-slate-600" /></td>
                <td className="p-6 border-b border-slate-800"><Check className="text-slate-400" /></td>
              </tr>
              <tr>
                <td className="p-6 border-b border-slate-800">Instant Response to No-Shows</td>
                <td className="p-6 border-b border-indigo-500/20 bg-indigo-500/5"><Check className="text-indigo-400" /></td>
                <td className="p-6 border-b border-slate-800"><Check className="text-slate-400" /></td>
                <td className="p-6 border-b border-slate-800"><X className="text-slate-600" /> (Usually too busy)</td>
              </tr>
              <tr>
                <td className="p-6 border-b border-slate-800">Waitlist Cascading</td>
                <td className="p-6 border-b border-indigo-500/20 bg-indigo-500/5"><Check className="text-indigo-400" /></td>
                <td className="p-6 border-b border-slate-800"><X className="text-slate-600" /></td>
                <td className="p-6 border-b border-slate-800"><X className="text-slate-600" /></td>
              </tr>
              <tr>
                <td className="p-6 border-b border-slate-800">Zero Added Labor</td>
                <td className="p-6 border-b border-indigo-500/20 bg-indigo-500/5 rounded-b-2xl"><Check className="text-indigo-400" /></td>
                <td className="p-6 border-b border-slate-800"><Check className="text-slate-400" /></td>
                <td className="p-6 border-b border-slate-800"><X className="text-slate-600" /></td>
              </tr>
            </tbody>
          </motion.table>
        </div>
      </div>
    </section>
  );
}
