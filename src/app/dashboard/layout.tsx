'use client';

import { Activity, TrendingUp, CalendarX2, PhoneCall, Users, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: TrendingUp },
    { name: 'No-Shows', href: '/dashboard/no-shows', icon: CalendarX2 },
    { name: 'Call Logs', href: '/dashboard/calls', icon: PhoneCall },
    { name: 'Waitlist', href: '/dashboard/waitlist', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 relative overflow-hidden flex">
      {/* Premium Background Glows */}
      <div className="fixed top-0 left-1/4 w-[800px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[500px] bg-cyan-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Sidebar */}
      <div className="hidden lg:flex flex-col fixed top-0 left-0 w-64 h-screen border-r border-slate-800/50 bg-slate-950/80 backdrop-blur-xl p-6 z-20">
        <Link href="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight">RebookRelay</span>
        </Link>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name}
                href={item.href} 
                className={`flex items-center gap-3 font-medium px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'text-indigo-400 bg-indigo-500/10 border border-indigo-500/20' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                }`}
              >
                <item.icon className="w-5 h-5" /> {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 p-6 md:p-10 relative z-10 w-full">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
