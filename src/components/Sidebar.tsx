'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  FileText, 
  StickyNote, 
  Lock, 
  Sparkles, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Documents', href: '/documents', icon: FileText },
    { name: 'Notes', href: '/notes', icon: StickyNote },
    { name: 'Vault', href: '/vault', icon: Lock },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-brand-blue flex items-center justify-center text-white font-bold text-lg">
            T
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900">TechPro</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Toggle navigation"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 transition-transform duration-300 ease-in-out lg:sticky lg:h-screen lg:top-0
      `}>
        <div>
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold text-xl shadow-glow">
                T
              </div>
              <div>
                <span className="font-bold text-xl tracking-tight text-slate-900 block">TechPro</span>
                <span className="text-[10px] text-brand-blue font-semibold tracking-wider uppercase text-left block">Project Core</span>
              </div>
            </Link>
            {/* Close Button Mobile */}
            <button 
              onClick={() => setIsOpen(false)} 
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
            >
              <X size={18} />
            </button>
          </div>

          {/* Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200
                    ${isActive 
                      ? 'bg-brand-blue text-white shadow-glow' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with User info & Logout */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {session?.user && (
            <div className="px-4 py-2 bg-slate-50 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-sm flex-shrink-0">
                {session.user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <span className="block text-xs font-semibold text-slate-900 truncate text-left">
                  {session.user.email}
                </span>
                <span className="block text-[10px] text-slate-400 text-left">
                  Administrator
                </span>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={18} className="text-rose-400" />
            Logout
          </button>
        </div>
      </div>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-30 lg:hidden"
        />
      )}
    </>
  );
}
