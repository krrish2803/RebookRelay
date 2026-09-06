'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Star, Clock, X, Loader2, Phone, MessageSquare, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = ['Morning', 'Afternoon', 'Evening'];
const CONTACT_METHODS = [
  { value: 'phone', label: 'Phone Call', icon: Phone },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
];

export default function WaitlistPage() {
  const [people, setPeople] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalActive: 0, topPriority: 0 });
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceType: '',
    preferredDays: [] as string[],
    preferredTimeSlots: [] as string[],
    contactMethod: 'phone',
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    fetchWaitlist();
  }, []);

  const fetchWaitlist = () => {
    fetch('/api/dashboard/waitlist')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPeople(data.data.people);
          setStats(data.data.stats);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleAdd = async () => {
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch('/api/dashboard/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ name: '', phone: '', email: '', serviceType: '', preferredDays: [], preferredTimeSlots: [], contactMethod: 'phone' });
        fetchWaitlist();
      } else {
        setAddError(data.error || 'Failed to add');
      }
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setAddForm(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const toggleTimeSlot = (slot: string) => {
    setAddForm(prev => ({
      ...prev,
      preferredTimeSlots: prev.preferredTimeSlots.includes(slot)
        ? prev.preferredTimeSlots.filter(s => s !== slot)
        : [...prev.preferredTimeSlots, slot]
    }));
  };

  const formatPrefs = (prefs: any) => {
    if (!prefs || !Array.isArray(prefs) || prefs.length === 0) return 'Anytime';
    return prefs.join(', ');
  };

  const formatDays = (days: any) => {
    if (!days || !Array.isArray(days) || days.length === 0) return 'Any day';
    if (days.length === 7) return 'Every day';
    return days.join(', ');
  };

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'sms': return <MessageSquare className="w-3 h-3" />;
      case 'email': return <Mail className="w-3 h-3" />;
      default: return <Phone className="w-3 h-3" />;
    }
  };

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Smart Waitlist</h1>
          <p className="text-slate-400">Manage clients waiting for a slot. Priority is calculated automatically.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-4 py-2 rounded-xl transition-all flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add to Waitlist
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1">{stats.totalActive}</h3>
          <p className="text-slate-400 text-sm">Active on Waitlist</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1">{people.length}</h3>
          <p className="text-slate-400 text-sm">Total People</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl">
          <h3 className="text-3xl font-black mb-1 text-emerald-400">{stats.topPriority}</h3>
          <p className="text-slate-400 text-sm">Highest Priority Score</p>
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

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : people.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No one on the waitlist yet. Add someone to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-950/80 text-slate-400 text-sm">
                <tr>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Service</th>
                  <th className="p-4 font-medium">Preferred Days</th>
                  <th className="p-4 font-medium">Preferred Times</th>
                  <th className="p-4 font-medium">Contact</th>
                  <th className="p-4 font-medium">Waiting</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {people.map((p, i) => (
                  <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-xs text-slate-500">{p.email}</div>
                    </td>
                    <td className="p-4 text-slate-300">{p.serviceType}</td>
                    <td className="p-4 text-slate-400 text-sm">{formatDays(p.preferredDays)}</td>
                    <td className="p-4 text-slate-400 text-sm">{formatPrefs(p.preferredTimeSlots)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-full">
                        {getContactIcon(p.contactMethod)}
                        {p.contactMethod}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-slate-400 text-sm">
                        <Clock className="w-3 h-3" /> {p.daysOnWaitlist}d
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        p.status === 'BOOKED' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center justify-end gap-1 font-bold ${
                        i === 0 ? 'text-emerald-400' : 'text-slate-300'
                      }`}>
                        {i === 0 && <Star className="w-4 h-4 fill-emerald-400" />}
                        {p.priorityScore ?? '--'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                <h3 className="font-bold text-lg">Add to Waitlist</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {addError && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm">{addError}</div>}

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Name</label>
                  <input value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="John Doe" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Phone</label>
                  <input value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="+1234567890" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Email</label>
                  <input value={addForm.email} onChange={e => setAddForm({...addForm, email: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Service Type</label>
                  <input value={addForm.serviceType} onChange={e => setAddForm({...addForm, serviceType: e.target.value})} className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Teeth Whitening" />
                </div>

                <div className="border-t border-slate-800 pt-5">
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Preferred Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          addForm.preferredDays.includes(day)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Preferred Time Slots</label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        onClick={() => toggleTimeSlot(slot)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          addForm.preferredTimeSlots.includes(slot)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-3 block">Preferred Contact Method</label>
                  <div className="flex gap-2">
                    {CONTACT_METHODS.map(method => (
                      <button
                        key={method.value}
                        onClick={() => setAddForm({...addForm, contactMethod: method.value})}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          addForm.contactMethod === method.value
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <method.icon className="w-4 h-4" />
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleAdd} disabled={addLoading || !addForm.name || !addForm.phone || !addForm.email || !addForm.serviceType} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {addLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Add Person'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
