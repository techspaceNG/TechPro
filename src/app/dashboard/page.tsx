'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  FolderKanban, 
  Activity, 
  CheckCircle2, 
  StickyNote, 
  Plus, 
  ArrowRight,
  TrendingUp,
  Lock,
  FileText,
  User
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'in_progress' | 'completed';
  progress: number;
  tasks: any[];
  updatedAt: string;
}

interface Note {
  _id: string;
  title: string;
  isGlobal: boolean;
}

export default function Dashboard() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [projRes, noteRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/notes')
        ]);
        
        if (projRes.ok && noteRes.ok) {
          const projData = await projRes.json();
          const noteData = await noteRes.json();
          setProjects(projData);
          setNotes(noteData);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalNotes = notes.length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-brand-blue/20 border-t-brand-blue rounded-lg animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-left">
              Welcome back, {session?.user?.name || 'Developer'}!
            </h1>
            <p className="text-sm text-slate-500 mt-1 text-left">
              {(session?.user as any)?.occupation || 'Administrator'} • Real-time workspace stats
            </p>
          </div>
          <Link
            href="/projects?new=true"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-all shadow-glow self-start sm:self-auto"
          >
            <Plus size={16} />
            New Project
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Projects */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-brand-blue transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Total Projects</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 text-left">{totalProjects}</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-brand-blue-light group-hover:text-brand-blue transition-colors">
                <FolderKanban size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <TrendingUp size={14} className="text-brand-blue mr-1" />
              <span>Workspace database active</span>
            </div>
          </div>

          {/* Card 2: Active Projects */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-brand-blue transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Active / In Progress</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 text-left">{activeProjects}</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Activity size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue animate-ping mr-2" />
              <span>Currently being tracked</span>
            </div>
          </div>

          {/* Card 3: Completed Projects */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-emerald-500 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Completed Projects</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 text-left">{completedProjects}</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <CheckCircle2 size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400">
              <span className="text-emerald-600 font-semibold mr-1">
                {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}%
              </span>
              <span>completion rate</span>
            </div>
          </div>

          {/* Card 4: Total Notes */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-amber-500 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Total Notes</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2 text-left">{totalNotes}</h3>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                <StickyNote size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs text-slate-400 font-sans">
              <span>Markdown documentation logs</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Overview List */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Projects</h2>
              <Link href="/projects" className="text-xs font-bold text-brand-blue hover:underline flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                No projects found. Create your first project to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {projects.slice(0, 5).map((project) => {
                  const statusColors = {
                    active: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
                    in_progress: 'bg-brand-blue-light text-brand-blue border border-brand-blue/20',
                    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  };
                  return (
                    <div 
                      key={project._id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-lg hover:border-slate-200 transition-all gap-4"
                    >
                      <div className="space-y-1">
                        <Link href={`/projects/${project._id}`} className="font-bold text-slate-900 hover:text-brand-blue transition-colors text-left block">
                          {project.name}
                        </Link>
                        <p className="text-xs text-slate-400 line-clamp-1 text-left">{project.description || 'No description provided.'}</p>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-shrink-0 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
                        {/* Progress */}
                        <div className="flex items-center gap-2">
                          <div className="w-20 sm:w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-brand-blue h-1.5 rounded-full" 
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-8 text-right">{project.progress}%</span>
                        </div>

                        {/* Status badge */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusColors[project.status] || statusColors.active}`}>
                          {project.status === 'in_progress' ? 'In Progress' : project.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions & Notes Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-4">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link 
                  href="/vault" 
                  className="p-3 border border-slate-100 hover:border-brand-blue hover:shadow-glow rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 group"
                >
                  <Lock size={20} className="text-slate-400 group-hover:text-brand-blue transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">Open Vault</span>
                </Link>
                <Link 
                  href="/documents" 
                  className="p-3 border border-slate-100 hover:border-brand-blue hover:shadow-glow rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 group"
                >
                  <FileText size={20} className="text-slate-400 group-hover:text-brand-blue transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">Documents</span>
                </Link>
                <Link 
                  href="/notes" 
                  className="p-3 border border-slate-100 hover:border-brand-blue hover:shadow-glow rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 group"
                >
                  <StickyNote size={20} className="text-slate-400 group-hover:text-brand-blue transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">Notes Log</span>
                </Link>
                <Link 
                  href="/profile" 
                  className="p-3 border border-slate-100 hover:border-brand-blue hover:shadow-glow rounded-lg flex flex-col items-center justify-center text-center transition-all duration-200 group"
                >
                  <User size={20} className="text-slate-400 group-hover:text-brand-blue transition-colors mb-2" />
                  <span className="text-xs font-bold text-slate-700">My Profile</span>
                </Link>
              </div>
            </div>

            {/* Quick Secure Vault Indicator Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-white relative overflow-hidden secure-glow-pulse">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-brand-blue">
                  <Lock size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Vault Status</span>
                </div>
                <h3 className="text-lg font-bold text-left">Secure Environment</h3>
                <p className="text-xs text-slate-400 leading-relaxed text-left">
                  TechPro vault implements cryptographic AES-256-GCM encryption key hashes. Passwords remain masked unless authenticated explicitly.
                </p>
                <Link 
                  href="/vault" 
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-white transition-colors"
                >
                  Configure credentials <ArrowRight size={12} />
                </Link>
              </div>
              <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-slate-50">
                <Lock size={120} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
