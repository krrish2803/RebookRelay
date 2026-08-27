import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import Problem from '@/components/Problem';
import USP from '@/components/USP';
import Features from '@/components/Features';
import Comparison from '@/components/Comparison';
import FAQ from '@/components/FAQ';
import CTA from '@/components/CTA';

// Dynamically import Hero to avoid SSR issues with Three.js/Canvas
const Hero = dynamic(() => import('@/components/Hero'), { ssr: false });

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <Header />
      <Hero />
      <Problem />
      <USP />
      <Features />
      <Comparison />
      <FAQ />
      <CTA />
      
      <footer className="py-8 text-center text-slate-500 border-t border-slate-900">
        <p>© {new Date().getFullYear()} RebookRelay. Built for the CALL-E Hackathon.</p>
      </footer>
    </main>
  );
}
