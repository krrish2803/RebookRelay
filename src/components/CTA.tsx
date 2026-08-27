'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="py-32 px-6 relative overflow-hidden" id="demo">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-indigo-900/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-indigo-500/20 blur-[120px] rounded-full" />
      
      <div className="relative z-10 max-w-4xl mx-auto text-center border border-indigo-500/20 bg-slate-900/40 backdrop-blur-xl p-12 md:p-20 rounded-[3rem]">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-6xl font-extrabold mb-6"
        >
          Ready to fill every <br/>
          <span className="text-indigo-400">empty slot?</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
        >
          Join the next generation of clinics and service businesses that run at 100% capacity using intelligent AI recovery.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link href="/auth/signup" className="group px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full font-bold text-lg transition-all flex items-center justify-center gap-3 mx-auto w-fit">
            Start Your Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
