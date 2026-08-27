'use client';

import { motion } from 'framer-motion';
import { PhoneCall, UserCheck, UserX, ArrowRight } from 'lucide-react';

export default function USP() {
  return (
    <section className="py-32 px-6 bg-slate-950 relative overflow-hidden" id="how-it-works">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-24">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white"
          >
            The Solution: <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Intelligent Cascading</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-3xl mx-auto font-medium"
          >
            While others stop at an SMS reminder, we execute a complete recovery workflow through natural voice AI. It's a closed-loop system guaranteed to fill your seats.
          </motion.p>
        </div>

        <div className="relative flex flex-col md:flex-row items-stretch justify-center gap-6 lg:gap-10">
          
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-800 -translate-y-1/2 z-0 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: '-100%' }}
              whileInView={{ x: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
              className="w-full h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
            />
          </div>

          {/* Step 1 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 lg:p-10 rounded-[2.5rem] relative z-10 shadow-2xl shadow-indigo-900/10 group"
          >
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
              <PhoneCall className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">1. Call Original Client</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              CALL-E immediately dials the no-show with an empathetic script, offering real-time available slots to recover them on the spot.
            </p>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 p-8 lg:p-10 rounded-[2.5rem] relative z-10 shadow-2xl shadow-rose-900/10 group"
          >
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-8 border border-rose-500/20 group-hover:bg-rose-500/20 transition-colors">
              <UserX className="w-8 h-8 text-rose-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">2. Automatic Cascade</h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              If the client declines or doesn't answer, the AI agent instantly pivots to the next phase without needing any staff approval.
            </p>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            whileHover={{ y: -10, scale: 1.02 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex-1 bg-gradient-to-b from-indigo-900/40 to-slate-900/80 backdrop-blur-xl border border-indigo-500/40 p-8 lg:p-10 rounded-[2.5rem] relative z-10 shadow-2xl shadow-cyan-900/20 group"
          >
            <div className="absolute inset-0 rounded-[2.5rem] border-2 border-transparent group-hover:border-indigo-400/30 transition-colors pointer-events-none" />
            <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-8 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-colors">
              <UserCheck className="w-8 h-8 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">3. Fill via Waitlist</h3>
            <p className="text-slate-300 text-lg leading-relaxed">
              The agent dials the waitlist in order, naturally offering the newly freed slot until it's booked. Your calendar syncs instantly.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
