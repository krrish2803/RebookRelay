'use client';

import { motion } from 'framer-motion';
import { AlertCircle, Clock, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';

function Counter({ target }: { target: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = target;
    const duration = 2000;
    let startTime: number | null = null;

    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
      const easeOut = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      setCount(Math.floor(end * easeOut));

      if (percentage < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [target]);

  return <span>{count}</span>;
}

export default function Problem() {
  return (
    <section className="py-32 px-6 bg-slate-900/50" id="problem">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        {/* Left Side: Copy */}
        <div className="flex-1 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The No-Show Crisis</h2>
            <p className="text-xl text-slate-400">
              Empty chairs mean permanent revenue loss. Waiting for clients who never arrive is destroying your bottom line.
            </p>
          </motion.div>

          <motion.ul 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {[
              { icon: TrendingDown, text: "Clinics lose 15–30% of potential revenue every month to no-shows and cancellations." },
              { icon: Clock, text: "Staff waste hours manually chasing clients via SMS or calls with low success rates." },
              { icon: AlertCircle, text: "Existing tools either only remind the original client or only notify the waitlist—never both." }
            ].map((item, idx) => (
              <motion.li 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="flex items-start gap-4"
              >
                <div className="mt-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  <item.icon className="w-5 h-5 text-rose-400" />
                </div>
                <p className="text-lg text-slate-300 leading-relaxed">{item.text}</p>
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Right Side: Animated Graphic */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="mb-8">
            <h3 className="text-slate-400 font-medium mb-2">Average Monthly Revenue Lost</h3>
            <div className="text-6xl font-black text-rose-400 font-mono tracking-tighter">
              $<Counter target={12500} />
            </div>
          </div>

          <div className="space-y-4">
            {[80, 40, 100, 60, 90].map((height, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 text-sm text-slate-500 font-mono">Wk {i+1}</div>
                <div className="flex-1 h-8 bg-slate-800 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.5 + (i * 0.1), ease: "easeOut" }}
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
}
