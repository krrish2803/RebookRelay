'use client';

import { motion } from 'framer-motion';
import { PhoneCall } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 border-b border-white/10 bg-slate-950/50 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-500/20 p-2 rounded-xl group-hover:bg-indigo-500/30 transition-colors">
            <PhoneCall className="w-5 h-5 text-indigo-400" />
          </div>
          <span className="font-bold text-xl tracking-tight">RebookRelay</span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#problem" className="hover:text-white transition-colors">The Problem</Link>
          <Link href="#how-it-works" className="hover:text-white transition-colors">The Solution</Link>
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#faq" className="hover:text-white transition-colors">FAQ</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link 
            href="#demo" 
            className="px-5 py-2.5 text-sm font-medium bg-white text-slate-950 hover:bg-slate-200 transition-colors rounded-full"
          >
            See Demo
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
