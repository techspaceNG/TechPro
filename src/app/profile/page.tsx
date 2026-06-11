'use client';

import { useSession, signOut } from 'next-auth/react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Database, 
  KeyRound, 
  LogOut, 
  Activity, 
  Cpu
} from 'lucide-react';

export default function Profile() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Workspace Profile</h1>
            <p className="text-sm text-slate-500 mt-1">Manage session parameters and view server configuration profiles</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* Account Details */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 text-left border-b border-slate-100 pb-3">Account Details</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Email Address</span>
                    <span className="text-sm font-semibold text-slate-800 text-left block mt-0.5">{session?.user?.email || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Role</span>
                    <span className="text-sm font-semibold text-slate-800 text-left block mt-0.5">Primary Workspace Administrator</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-500">
                    <Activity size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Session Status</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active authenticated session
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all"
                >
                  <LogOut size={14} />
                  Logout Session
                </button>
              </div>
            </div>

            {/* System Info */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900 text-left border-b border-slate-100 pb-3">System Properties</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Database size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Database Status</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 block text-left">Connected</span>
                  <span className="text-[10px] text-slate-400 block text-left truncate">Cluster0 MongoDB Atlas</span>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-slate-500">
                    <KeyRound size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Cryptographic Safe</span>
                  </div>
                  <span className="text-xs font-bold text-brand-blue block text-left">AES-256-GCM Guard</span>
                  <span className="text-[10px] text-slate-400 block text-left">32-character key mapped</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white space-y-4">
              <div className="flex items-center gap-2 text-brand-blue">
                <Cpu size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">TechPro Core</span>
              </div>
              <h3 className="font-bold text-lg text-left">Single User Mode</h3>
              <p className="text-xs text-slate-400 leading-relaxed text-left">
                TechPro runs in dedicated single-user configuration, disabling public registration pages after setup to protect your private credentials and notes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
