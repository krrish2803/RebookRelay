'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { PhoneCall, PlayCircle, FileText, CheckCircle2, XCircle, X, Mic, User } from 'lucide-react';
import { useState } from 'react';

export default function CallLogsPage() {
  const [selectedCall, setSelectedCall] = useState<any>(null);

  const mockCalls = [
    {
      id: "call_9a8b7c6d",
      client: "Sarah Jenkins",
      type: "Original Client Recovery",
      duration: "01:24",
      sentiment: "Positive 😊",
      outcome: "RECOVERED",
      date: "Today, 10:45 AM",
      transcript: [
        { speaker: "AI", text: "Hi Sarah, this is Alex from Apex Dental calling. I noticed you couldn't make your 10:00 AM appointment today. Is everything okay?" },
        { speaker: "Client", text: "Oh my gosh, I am so sorry! My car wouldn't start this morning and I completely forgot to call." },
        { speaker: "AI", text: "That's completely fine, car troubles happen! Would you like to reschedule for tomorrow at 2:00 PM?" },
        { speaker: "Client", text: "Yes please, that would be perfect." },
        { speaker: "AI", text: "Great, I've got you locked in for tomorrow at 2. See you then!" }
      ]
    },
    {
      id: "call_5f4e3d2c",
      client: "Michael Scott",
      type: "Waitlist Offer",
      duration: "00:45",
      sentiment: "Neutral 😐",
      outcome: "DECLINED",
      date: "Today, 09:15 AM",
      transcript: [
        { speaker: "AI", text: "Hi Michael, this is Alex from Apex Dental. A premium slot just opened up today at 10:00 AM. Would you like to take it?" },
        { speaker: "Client", text: "Uh, no I'm in a meeting right now. I can\'t make it that soon." },
        { speaker: "AI", text: "No problem at all Michael, we will keep you on the waitlist for future openings. Have a great day!" }
      ]
    }
  ];

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">AI Call Logs</h1>
          <p className="text-slate-400">Review transcripts and recordings of CALL-E conversations.</p>
        </div>
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
          <span className="text-sm text-slate-400">Total calls this week: 28</span>
        </div>

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
              {mockCalls.map((call) => (
                <tr key={call.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-white">{call.client}</div>
                    <div className="text-xs text-slate-500">{call.date}</div>
                  </td>
                  <td className="p-4 text-slate-300">{call.type}</td>
                  <td className="p-4 text-slate-400">{call.duration}</td>
                  <td className="p-4">{call.sentiment}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      call.outcome === 'RECOVERED' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {call.outcome === 'RECOVERED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {call.outcome}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setSelectedCall(call)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors" title="Play Recording">
                        <PlayCircle className="w-4 h-4" />
                      </button>
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
      </motion.div>

      {/* Modal */}
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
              transition={{ duration: 0.2 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h3 className="font-bold text-lg text-white">Call Details: {selectedCall.client}</h3>
                  <p className="text-sm text-slate-400">{selectedCall.date} • {selectedCall.duration}</p>
                </div>
                <button onClick={() => setSelectedCall(null)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Fake Audio Player */}
              <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex items-center gap-4">
                <button className="w-12 h-12 flex items-center justify-center bg-indigo-500 rounded-full hover:bg-indigo-600 transition-colors text-white">
                  <PlayCircle className="w-6 h-6" />
                </button>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-indigo-500 rounded-full" />
                </div>
                <span className="text-sm font-medium text-slate-400">00:14 / {selectedCall.duration}</span>
              </div>

              {/* Transcript */}
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Transcript</h4>
                
                {selectedCall.transcript.map((line: any, i: number) => (
                  <div key={i} className={`flex gap-4 ${line.speaker === 'AI' ? '' : 'flex-row-reverse'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${line.speaker === 'AI' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'}`}>
                      {line.speaker === 'AI' ? <Mic className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl max-w-[80%] ${line.speaker === 'AI' ? 'bg-indigo-500/10 border border-indigo-500/20 text-slate-200 rounded-tl-none' : 'bg-slate-800 text-slate-200 rounded-tr-none'}`}>
                      {line.text}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
