'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, PhoneCall, CheckCircle2, Clock, Loader2, ExternalLink, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';

interface CalendarEvent {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceType: string;
  durationMin: number;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  hasRecoveryCase: boolean;
  recoveryCaseId: string | null;
  recoveryStatus: string | null;
  recoveryOutcome: string | null;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState<string | null>(null);
  const [recoverMsg, setRecoverMsg] = useState<{ id: string; type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch('/api/dashboard/calendar-events')
      .then(res => res.json())
      .then(data => {
        if (data.success) setEvents(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleRecover = async (eventId: string) => {
    setRecovering(eventId);
    setRecoverMsg(null);
    try {
      const res = await fetch('/api/dashboard/trigger-cascade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarEventId: eventId }),
      });
      const data = await res.json();
      if (data.success) {
        setRecoverMsg({ id: eventId, type: 'success', msg: 'Recovery cascade triggered!' });
        fetchEvents();
      } else {
        setRecoverMsg({ id: eventId, type: 'error', msg: data.error || 'Failed' });
      }
    } catch {
      setRecoverMsg({ id: eventId, type: 'error', msg: 'Network error' });
    } finally {
      setRecovering(null);
      setTimeout(() => setRecoverMsg(null), 4000);
    }
  };

  const formatTime = (d: string) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'no_show': return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-medium">No-Show</span>;
      case 'confirmed': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium">Confirmed</span>;
      case 'completed': return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full text-xs font-medium">Completed</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const getRecoveryBadge = (event: CalendarEvent) => {
    if (!event.hasRecoveryCase) return null;
    switch (event.recoveryOutcome) {
      case 'BOOKED': return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Recovered</span>;
      case 'NOT_BOOKED': return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-full text-xs font-medium">Failed</span>;
      case 'PENDING': return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3 animate-pulse"/> In Progress</span>;
      default: return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-1 rounded-full text-xs font-medium">{event.recoveryStatus}</span>;
    }
  };

  const isPast = (d: string) => new Date(d) < new Date();

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Calendar Events</h1>
          <p className="text-slate-400">Browse appointments and trigger one-click recovery for any past slot.</p>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center gap-2 bg-slate-950/30">
          <Calendar className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold">All Appointments</h2>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No calendar events found. Connect Google Calendar and sync first.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Service</th>
                  <th className="p-4 font-medium">Scheduled</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Recovery</th>
                  <th className="p-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {events.map((event) => (
                  <motion.tr key={event.id} layout className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{event.clientName}</div>
                      <div className="text-xs text-slate-500">{event.clientPhone}</div>
                    </td>
                    <td className="p-4 text-slate-300">{event.serviceType}</td>
                    <td className="p-4">
                      <div className="text-sm text-slate-300">{formatTime(event.scheduledStart)}</div>
                      <div className="text-xs text-slate-500">{event.durationMin} min</div>
                    </td>
                    <td className="p-4">{getStatusBadge(event.status)}</td>
                    <td className="p-4">{getRecoveryBadge(event)}</td>
                    <td className="p-4 text-right">
                      {event.hasRecoveryCase ? (
                        <span className="text-xs text-slate-500">Already triggered</span>
                      ) : isPast(event.scheduledStart) ? (
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={() => handleRecover(event.id)}
                            disabled={recovering === event.id}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-full transition-all disabled:opacity-50"
                          >
                            {recovering === event.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Zap className="w-3 h-3" />
                            )}
                            Recover this slot
                          </button>
                          <AnimatePresence>
                            {recoverMsg && recoverMsg.id === event.id && (
                              <motion.span
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className={`text-xs font-medium ${recoverMsg.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
                              >
                                {recoverMsg.msg}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Upcoming</span>
                      )}
                    </td>
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
