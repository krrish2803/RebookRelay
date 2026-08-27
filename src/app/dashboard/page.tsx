'use client';

import { motion } from 'framer-motion';
import { 
  DollarSign, 
  PhoneCall, 
  CalendarX2, 
  TrendingUp, 
  Activity, 
  Users, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

const CHART_DATA = [
  { time: 'Mon', value: 400 },
  { time: 'Tue', value: 300 },
  { time: 'Wed', value: 600 },
  { time: 'Thu', value: 800 },
  { time: 'Fri', value: 1200 },
  { time: 'Sat', value: 1800 },
  { time: 'Sun', value: 2400 },
];

const SENTIMENT_DATA = [
  { name: 'Positive', value: 18, color: '#10b981' },
  { name: 'Neutral', value: 7, color: '#64748b' },
  { name: 'Negative', value: 3, color: '#f43f5e' },
];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    // Fetch metrics from our new API
    fetch('/api/dashboard/metrics')
      .then(res => res.json())
      .then(data => setMetrics(data.data));
  }, []);

  return (
    <div>
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Revenue Recovery</h1>
          <p className="text-slate-400">Live AI cascade performance for Apex Dental.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            CALL-E Active
          </span>
        </div>
      </header>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { label: "Recovered Revenue", value: metrics ? `$${metrics.revenueRecovered}` : "---", icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "No-Shows Detected", value: metrics?.noShowsDetected !== undefined ? metrics.noShowsDetected : "-", icon: CalendarX2, color: "text-rose-400", bg: "bg-rose-500/10" },
          { label: "AI Calls Placed", value: metrics?.callsPlaced !== undefined ? metrics.callsPlaced : "-", icon: PhoneCall, color: "text-indigo-400", bg: "bg-indigo-500/10" },
          { label: "Successful Rebookings", value: metrics?.rebookings !== undefined ? metrics.rebookings : "-", icon: CheckCircle2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <h3 className="text-4xl font-black tracking-tight mb-1">{stat.value}</h3>
            <p className="text-slate-400 font-medium text-sm">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl"
        >
          <h3 className="font-bold text-lg mb-6">Revenue Recovery (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sentiment Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 p-6 rounded-3xl"
        >
          <h3 className="font-bold text-lg mb-6">AI Call Sentiment</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={SENTIMENT_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {SENTIMENT_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Interactive Hackathon Demo Row */}
      <div className="grid grid-cols-1 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 p-8 rounded-3xl"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                <Activity className="w-6 h-6" /> Live Cascade Orchestration (Demo)
              </h3>
              <p className="text-slate-400 text-sm mt-1">Simulate the Inngest workflow and CALL-E webhook outcomes without burning real credits.</p>
            </div>
            <button 
              onClick={() => {
                setDemoStep(0);
                setTimeout(() => setDemoStep(1), 1000);
                setTimeout(() => setDemoStep(2), 4000);
                setTimeout(() => setDemoStep(3), 7000);
                setTimeout(() => setDemoStep(4), 10000);
              }}
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4" /> Trigger "Test Cascade"
            </button>
          </div>
          
          {demoStep === 0 && (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
              Click the button above to simulate a no-show detection and AI cascade.
            </div>
          )}

          <div className="space-y-4">
            {/* Step 1: Call Original Client */}
            {demoStep >= 1 && (
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {demoStep === 1 ? <Clock className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  <span className="font-bold text-lg">Step 1: Calling Original Client (No-Show)</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase">Dynamic Prompt Sent to CALL-E:</span>
                  <p className="text-indigo-300 font-mono text-sm mt-2">"Hi [Client], we missed you at your 10AM appointment! Are you safe? Would you like to reschedule for tomorrow?"</p>
                </div>
                {demoStep >= 2 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                     <span className="text-xs font-bold text-slate-500 uppercase">Webhook JSON Received:</span>
                     <pre className="text-emerald-400 font-mono text-xs mt-2 overflow-x-auto">
{`{
  "outcome": "DECLINED",
  "sentiment": "Neutral",
  "transcript_snippet": "Client: No sorry I am out of town.",
  "duration": "00:45"
}`}
                     </pre>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Call Waitlist */}
            {demoStep >= 3 && (
              <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 flex flex-col gap-4 mt-6">
                <div className="flex items-center gap-3">
                  {demoStep === 3 ? <Clock className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                  <span className="font-bold text-lg">Step 2: Cascading to Priority Waitlist (#1)</span>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs font-bold text-slate-500 uppercase">Dynamic Prompt Sent to CALL-E:</span>
                  <p className="text-emerald-300 font-mono text-sm mt-2">"Hi [Waitlist], a premium slot just opened up right now at 10AM! Because you have high priority, you have 5 minutes to claim it. Do you want it?"</p>
                </div>
                {demoStep >= 4 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 border-l-4 border-l-emerald-500">
                     <span className="text-xs font-bold text-slate-500 uppercase">Webhook JSON Received:</span>
                     <pre className="text-emerald-400 font-mono text-xs mt-2 overflow-x-auto">
{`{
  "outcome": "BOOKED",
  "sentiment": "Positive 🤩",
  "transcript_snippet": "Client: Yes please! I am on my way!",
  "action_taken": "Google Calendar Updated"
}`}
                     </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
