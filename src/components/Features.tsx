'use client';

import { useEffect, useRef } from 'react';
import { CalendarDays, Bot, LayoutDashboard, BrainCircuit, ShieldCheck, ListOrdered } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    title: 'Real-Time Calendar Sync',
    description: 'Instantly reads your calendar for missed appointments and writes confirmed bookings back. No manual data entry required.',
    icon: CalendarDays,
    color: 'from-blue-500/20 to-blue-500/5',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    colSpan: 'md:col-span-2 lg:col-span-1'
  },
  {
    title: 'Natural Conversation AI',
    description: 'Powered by CALL-E, the system makes human-like phone calls that handle objections, adapt in real-time, and sound completely natural.',
    icon: Bot,
    color: 'from-indigo-500/20 to-indigo-500/5',
    borderColor: 'border-indigo-500/30',
    iconColor: 'text-indigo-400',
    colSpan: 'md:col-span-2'
  },
  {
    title: 'Structured JSON Outcomes',
    description: 'Every conversation returns clean, actionable JSON data. Instantly know if they rebooked, declined, or need follow-up.',
    icon: BrainCircuit,
    color: 'from-purple-500/20 to-purple-500/5',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    colSpan: 'md:col-span-2'
  },
  {
    title: 'Waitlist Management',
    description: 'Intelligently routes open slots to the best candidates on your waitlist without staff lifting a finger.',
    icon: ListOrdered,
    color: 'from-amber-500/20 to-amber-500/5',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    colSpan: 'md:col-span-1'
  },
  {
    title: 'Revenue Recovery Dashboard',
    description: 'See live cases, recovery rate, and estimated revenue saved in a beautiful, real-time staff dashboard.',
    icon: LayoutDashboard,
    color: 'from-emerald-500/20 to-emerald-500/5',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    colSpan: 'md:col-span-2 lg:col-span-1'
  },
  {
    title: 'Compliance-Ready (GDPR)',
    description: 'Built with privacy in mind. Data is handled securely and the AI respects do-not-call requests immediately.',
    icon: ShieldCheck,
    color: 'from-slate-500/20 to-slate-500/5',
    borderColor: 'border-slate-500/30',
    iconColor: 'text-slate-400',
    colSpan: 'md:col-span-2'
  }
];

export default function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cardsRef.current.forEach((card, i) => {
        if (!card) return;
        
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: card,
              start: 'top 85%',
            }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="py-32 px-6 bg-slate-950 relative" id="features" ref={containerRef}>
      {/* Abstract background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <h2 className="text-4xl md:text-6xl font-black mb-16 text-center tracking-tight">
          Everything you need to <br className="hidden md:block"/>
          <span className="text-indigo-400">recover revenue.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx}
                ref={(el) => { cardsRef.current[idx] = el; }}
                className={`group relative p-8 rounded-[2rem] bg-gradient-to-br ${feature.color} border ${feature.borderColor} backdrop-blur-xl overflow-hidden ${feature.colSpan} hover:-translate-y-2 transition-transform duration-300`}
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-900/80 mb-8 border ${feature.borderColor} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-8 h-8 ${feature.iconColor}`} />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
