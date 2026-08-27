'use client';

import { motion } from 'framer-motion';
import { Settings2, Mail, Lock, Eye, EyeOff, AlertTriangle, Building, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [user, setUser] = useState({
    clinicName: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.data);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleDeleteAccount = () => {
    setIsDeleting(true);
    // Simulate API call to delete account
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <header className="flex justify-between items-end mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2">Account Settings</h1>
          <p className="text-slate-400">Manage your clinic profile and security preferences.</p>
        </div>
      </header>

      <div className="space-y-6">
        {/* Profile Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800/50 flex items-center gap-3 bg-slate-950/30">
            <Settings2 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg">Clinic Profile</h2>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Clinic Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  defaultValue={user.clinicName}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  defaultValue={user.email}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 cursor-not-allowed opacity-70"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  defaultValue={user.password}
                  disabled
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-12 cursor-not-allowed opacity-70"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 ml-1 mt-1">For this demo, profile editing is disabled.</p>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-rose-500/5 border border-rose-500/20 rounded-3xl overflow-hidden"
        >
          <div className="p-6 border-b border-rose-500/10 flex items-center gap-3 bg-rose-500/5">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <h2 className="font-bold text-lg text-rose-400">Danger Zone</h2>
          </div>
          
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-bold text-white mb-1">Delete Account</h3>
              <p className="text-sm text-slate-400">
                Permanently remove your clinic, waitlist, and all AI call logs. This action cannot be undone.
              </p>
            </div>
            
            <button 
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="shrink-0 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
