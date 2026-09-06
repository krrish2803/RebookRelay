'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Phone, Calendar, Loader2 } from 'lucide-react';
import { useState, useEffect, use } from 'react';

export default function ConfirmPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [status, setStatus] = useState<'loading' | 'pending' | 'confirmed' | 'declined' | 'expired' | 'error'>('loading');
  const [data, setData] = useState<any>(null);
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetch(`/api/confirm?token=${token}`)
      .then(res => res.json())
      .then(result => {
        if (result.status === 'PENDING') {
          setStatus('pending');
          setData(result.data);
        } else if (result.status === 'CONFIRMED') {
          setStatus('confirmed');
        } else if (result.status === 'DECLINED') {
          setStatus('declined');
        } else if (result.error === 'Confirmation link expired') {
          setStatus('expired');
        } else {
          setStatus('error');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleResponse = async (response: 'YES' | 'NO') => {
    setResponding(true);
    try {
      const res = await fetch(`/api/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response }),
      });
      const result = await res.json();
      if (result.success) {
        setStatus(response === 'YES' ? 'confirmed' : 'declined');
      }
    } catch {
      setStatus('error');
    } finally {
      setResponding(false);
    }
  };

  const formatTime = (d: string) => {
    return new Date(d).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading confirmation...</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Invalid Link</h1>
          <p className="text-slate-400">This confirmation link is not valid.</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Link Expired</h1>
          <p className="text-slate-400">This confirmation link has expired. Please contact the clinic directly.</p>
        </motion.div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-black mb-2 text-emerald-400">Appointment Confirmed!</h1>
          <p className="text-slate-400 mb-6">We look forward to seeing you. If anything changes, please call the clinic.</p>
          <div className="bg-slate-800/50 rounded-xl p-4">
            <p className="text-sm text-slate-500">Booked via</p>
            <p className="font-bold text-white">RebookRelay AI</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (status === 'declined') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center">
          <XCircle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Appointment Declined</h1>
          <p className="text-slate-400">No worries! The slot has been released. Feel free to book anytime.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden max-w-md w-full relative z-10">

        <div className="bg-indigo-500/10 border-b border-indigo-500/20 p-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center mx-auto mb-3">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-black">Appointment Confirmation</h1>
          <p className="text-sm text-slate-400 mt-1">from {data?.clinicName || 'the clinic'}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-500">Service</p>
                <p className="font-bold text-white">{data?.serviceType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-indigo-400" />
              <div>
                <p className="text-xs text-slate-500">Scheduled Time</p>
                <p className="font-bold text-white">{data?.slotTime ? formatTime(data.slotTime) : '--'}</p>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-sm text-center">
            Hi <span className="font-bold text-white">{data?.clientName}</span>, can you make this appointment?
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleResponse('YES')}
              disabled={responding}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {responding ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  YES, I'll be there
                </>
              )}
            </button>
            <button
              onClick={() => handleResponse('NO')}
              disabled={responding}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              Can't make it
            </button>
          </div>

          <p className="text-xs text-slate-600 text-center pt-2">
            This link expires in 24 hours.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
