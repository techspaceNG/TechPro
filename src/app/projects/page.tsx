'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  FolderKanban, 
  Trash2, 
  AlertCircle, 
  X,
  Layers
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'in_progress' | 'completed';
  progress: number;
  tasks: { id: string; title: string; completed: boolean }[];
  createdAt: string;
}

function ProjectsContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'in_progress' | 'completed'>('active');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchProjects();
    if (searchParams.get('new') === 'true') {
      setModalOpen(true);
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, status }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      setProjects([data, ...projects]);
      setModalOpen(false);
      setName('');
      setDescription('');
      setStatus('active');
      
      if (searchParams.get('new') === 'true') {
        router.replace('/projects');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this project? This will permanently delete all associated vault credentials and notes.')) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setProjects(projects.filter((p) => p._id !== id));
      } else {
        alert('Failed to delete project');
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const statusBadges = {
    active: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    in_progress: 'bg-brand-blue-light text-brand-blue border border-brand-blue/20',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-2 border-brand-blue/20 border-t-brand-blue rounded-lg animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage your development projects</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-all shadow-glow self-start sm:self-auto"
        >
          <Plus size={16} />
          Create Project
        </button>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-16 text-center">
          <FolderKanban size={48} className="text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900">No projects yet</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            Get started by initializing your first project. Add milestones, track task completion, and encrypt critical details.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-all shadow-glow"
          >
            <Plus size={16} />
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const completedCount = project.tasks?.filter((t) => t.completed).length || 0;
            const totalTasks = project.tasks?.length || 0;
            
            return (
              <Link
                key={project._id}
                href={`/projects/${project._id}`}
                className="bg-white border border-slate-200 hover:border-brand-blue hover:shadow-glow rounded-lg p-6 flex flex-col justify-between transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {/* Status & Delete */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusBadges[project.status]}`}>
                      {project.status === 'in_progress' ? 'In Progress' : project.status}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, project._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-brand-blue transition-colors text-left leading-snug">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 text-left leading-relaxed">
                      {project.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                {/* Progress Footer */}
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers size={13} className="text-slate-400" />
                      {completedCount}/{totalTasks} Tasks
                    </span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-brand-blue h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => {
              setModalOpen(false);
              if (searchParams.get('new') === 'true') router.replace('/projects');
            }} 
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" 
          />
          
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create New Project</h3>
              <button
                onClick={() => {
                  setModalOpen(false);
                  if (searchParams.get('new') === 'true') router.replace('/projects');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Next.js SaaS Boilerplate"
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize the project objectives, stack, or target audience..."
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm bg-white transition-all"
                >
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    if (searchParams.get('new') === 'true') router.replace('/projects');
                  }}
                  className="flex-1 py-2.5 px-4 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all shadow-glow"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Projects() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-brand-blue/20 border-t-brand-blue rounded-lg animate-spin" />
        </div>
      }>
        <ProjectsContent />
      </Suspense>
    </DashboardLayout>
  );
}
