'use client';

import { motion } from 'framer-motion';
import { Settings2, Mail, Lock, Eye, EyeOff, AlertTriangle, Building, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  
  const [user, setUser] = useState({ clinicName: '', email: '', phone: '', businessType: '', timezone: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) setUser(data.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName: user.clinicName,
          phone: user.phone,
          email: user.email,
          currentPassword: passwords.currentPassword || undefined,
          newPassword: passwords.newPassword || undefined,
        })
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setPasswords({ currentPassword: '', newPassword: '' });
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch {
      setError('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      }
    } catch {
      setError('Failed to delete account');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800/50 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800/50 flex items-center gap-3 bg-slate-950/30">
            <Settings2 className="w-5 h-5 text-indigo-400" />
            <h2 className="font-bold text-lg">Clinic Profile</h2>
          </div>
          
          <div className="p-6 space-y-6">
            {error && <div className="p-3 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl text-sm">{error}</div>}
            {saveSuccess && <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 className="w-4 h-4"/> Settings saved successfully</div>}

            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Clinic Name</label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="text" 
                  value={user.clinicName}
                  onChange={e => setUser({...user, clinicName: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="email" 
                  value={user.email}
                  onChange={e => setUser({...user, email: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2 max-w-md">
              <label className="text-sm font-medium text-slate-300 ml-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input 
                  type="tel" 
                  value={user.phone}
                  onChange={e => setUser({...user, phone: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div className="border-t border-slate-800/50 pt-6">
              <h3 className="font-bold text-sm text-slate-300 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">Current Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="password" 
                      value={passwords.currentPassword}
                      onChange={e => setPasswords({...passwords, currentPassword: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Leave blank to keep current"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300 ml-1">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      value={passwords.newPassword}
                      onChange={e => setPasswords({...passwords, newPassword: e.target.value})}
                      className="w-full bg-slate-950/50 border border-slate-800 text-slate-300 rounded-xl py-3 pl-12 pr-12 focus:outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Leave blank to keep current"
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={isSaving} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-rose-500/5 border border-rose-500/20 rounded-3xl overflow-hidden">
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
              className={`shrink-0 font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 ${
                deleteConfirm 
                  ? 'bg-rose-500 text-white hover:bg-rose-600' 
                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20'
              }`}
            >
              {isDeleting ? 'Deleting...' : deleteConfirm ? 'Confirm Delete' : 'Delete Account'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
