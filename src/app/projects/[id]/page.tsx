'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Layers, 
  Lock, 
  StickyNote, 
  Plus, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink,
  Shield,
  FileEdit,
  Save,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface Project {
  _id: string;
  name: string;
  description: string;
  status: 'active' | 'in_progress' | 'completed';
  progress: number;
  tasks: Task[];
}

interface Credential {
  _id: string;
  site: string;
  username: string;
  notes?: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const router = useRouter();
  
  const [project, setProject] = useState<Project | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'vault' | 'notes'>('tasks');
  
  // Tasks state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // Vault state
  const [newSite, setNewSite] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCredNotes, setNewCredNotes] = useState('');
  const [decryptedPasswords, setDecryptedPasswords] = useState<{ [key: string]: string }>({});
  const [revealing, setRevealing] = useState<{ [key: string]: boolean }>({});
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [credError, setCredError] = useState('');

  // Notes state
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const [projRes, credRes, noteRes] = await Promise.all([
        fetch(`/api/projects/${id}`),
        fetch(`/api/credentials?projectId=${id}`),
        fetch(`/api/notes?projectId=${id}`)
      ]);

      if (projRes.ok && credRes.ok && noteRes.ok) {
        const projData = await projRes.json();
        const credData = await credRes.json();
        const noteData = await noteRes.json();
        
        setProject(projData);
        setCredentials(credData);
        setNotes(noteData);
        
        if (noteData.length > 0) {
          setEditingNoteId(noteData[0]._id);
          setNoteTitle(noteData[0].title);
          setNoteContent(noteData[0].content);
        } else {
          setNoteTitle('Project Wiki');
          setNoteContent('# Project Wiki\n\nWrite down project setup instructions, environment configurations, and stack details here...');
        }
      } else {
        router.push('/projects');
      }
    } catch (err) {
      console.error('Error loading project details', err);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  // Task Actions
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !project) return;

    const updatedTasks = [
      ...project.tasks,
      {
        id: Date.now().toString(),
        title: newTaskTitle.trim(),
        completed: false
      }
    ];

    await updateProjectTasks(updatedTasks);
    setNewTaskTitle('');
  };

  const handleToggleTask = async (taskId: string) => {
    if (!project) return;
    
    const updatedTasks = project.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    
    await updateProjectTasks(updatedTasks);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!project) return;
    
    const updatedTasks = project.tasks.filter(t => t.id !== taskId);
    await updateProjectTasks(updatedTasks);
  };

  const updateProjectTasks = async (updatedTasks: Task[]) => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: updatedTasks })
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to update tasks', err);
    }
  };

  const handleUpdateStatus = async (status: 'active' | 'in_progress' | 'completed') => {
    if (!project) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  // Credential Actions
  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSite || !newUsername || !newPassword) return;

    setCredError('');
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site: newSite,
          username: newUsername,
          password: newPassword,
          notes: newCredNotes,
          project: id
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setCredentials([data, ...credentials]);
        setNewSite('');
        setNewUsername('');
        setNewPassword('');
        setNewCredNotes('');
        setVaultModalOpen(false);
      } else {
        setCredError(data.error || 'Failed to save credential');
      }
    } catch (err) {
      setCredError('Error creating vault entry');
    }
  };

  const handleRevealPassword = async (credId: string) => {
    if (decryptedPasswords[credId]) {
      // Toggle visibility if already decrypted
      setRevealing(prev => ({ ...prev, [credId]: !prev[credId] }));
      return;
    }

    setRevealing(prev => ({ ...prev, [credId]: true }));
    try {
      const res = await fetch(`/api/credentials/${credId}/decrypt`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setDecryptedPasswords(prev => ({ ...prev, [credId]: data.password }));
      } else {
        alert('Failed to decrypt password');
        setRevealing(prev => ({ ...prev, [credId]: false }));
      }
    } catch (err) {
      console.error(err);
      setRevealing(prev => ({ ...prev, [credId]: false }));
    }
  };

  const handleDeleteCredential = async (credId: string) => {
    if (!confirm('Delete this credential permanently?')) return;
    try {
      const res = await fetch(`/api/credentials/${credId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setCredentials(credentials.filter(c => c._id !== credId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Notes Actions
  const handleSaveNote = async () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setNoteSaving(true);
    try {
      const url = editingNoteId ? `/api/notes/${editingNoteId}` : '/api/notes';
      const method = editingNoteId ? 'PUT' : 'POST';
      const body = {
        title: noteTitle,
        content: noteContent,
        project: id,
        isGlobal: false
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (res.ok) {
        if (!editingNoteId) {
          setNotes([data, ...notes]);
          setEditingNoteId(data._id);
        } else {
          setNotes(notes.map(n => n._id === editingNoteId ? data : n));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setNoteSaving(false);
    }
  };

  const statusBadges = {
    active: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
    in_progress: 'bg-brand-blue-light text-brand-blue border border-brand-blue/20',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-100'
  };

  if (loading || !project) {
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
      <div className="space-y-8 font-sans">
        {/* Back Link & Header */}
        <div className="space-y-4">
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-blue transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-slate-200 pb-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 text-left">{project.name}</h1>
              <p className="text-sm text-slate-500 text-left leading-relaxed max-w-2xl">{project.description || 'No description provided.'}</p>
            </div>
            
            {/* Status Select & Progress Circle */}
            <div className="flex items-center gap-4 self-start md:self-center">
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Status</span>
                <select
                  value={project.status}
                  onChange={(e: any) => handleUpdateStatus(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:border-brand-blue focus:outline-hidden bg-white text-slate-700"
                >
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="w-12 h-12 rounded-full border-4 border-slate-100 flex items-center justify-center relative bg-white flex-shrink-0">
                <span className="text-xs font-extrabold text-brand-blue">{project.progress}%</span>
                {/* SVG Radial border */}
                <svg className="absolute -inset-1 transform -rotate-90 pointer-events-none" width="56" height="56">
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    stroke="#0066FF"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={2 * Math.PI * 24 * (1 - project.progress / 100)}
                    className="transition-all duration-500"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'tasks' 
                ? 'border-brand-blue text-brand-blue' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers size={16} />
            Tasks Checklist
          </button>
          <button
            onClick={() => setActiveTab('vault')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'vault' 
                ? 'border-brand-blue text-brand-blue' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Lock size={16} />
            Password Safe
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'notes' 
                ? 'border-brand-blue text-brand-blue' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <StickyNote size={16} />
            Project Wiki & Notes
          </button>
        </div>

        {/* Tab Panels */}
        <div className="min-h-[400px]">
          {/* PANEL 1: TASKS */}
          {activeTab === 'tasks' && (
            <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 text-left">Milestones & Sub-tasks</h2>

              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Set up MongoDB indexes or Write login API test..."
                  className="flex-grow rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm transition-all"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center p-2 rounded-lg bg-brand-blue text-white hover:bg-brand-blue-dark transition-all shadow-glow"
                >
                  <Plus size={18} />
                </button>
              </form>

              {project.tasks.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  No tasks defined for this project yet. Add milestones above!
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {project.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-center justify-between py-3.5 group"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className="flex items-center gap-3 text-left"
                      >
                        <div className={`
                          w-5 h-5 rounded border flex items-center justify-center transition-all
                          ${task.completed 
                            ? 'bg-brand-blue border-brand-blue text-white shadow-glow' 
                            : 'border-slate-300 bg-white group-hover:border-brand-blue'}
                        `}>
                          {task.completed && <Check size={12} strokeWidth={3} />}
                        </div>
                        <span className={`text-sm font-medium transition-all ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                        }`}>
                          {task.title}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-slate-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PANEL 2: PASSWORD SAFE */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 text-left">Password Vault</h2>
                  <p className="text-xs text-slate-400 mt-0.5 text-left">Store project specific credentials. Encrypted on the server using AES-256-GCM.</p>
                </div>
                <button
                  onClick={() => setVaultModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-dark transition-all shadow-glow"
                >
                  <Plus size={14} />
                  Add Credential
                </button>
              </div>

              {credentials.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center max-w-xl">
                  <Shield size={32} className="text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-slate-800">Safe is Empty</h3>
                  <p className="text-xs text-slate-400 mt-1">Keep database strings, dashboard logins, or API keys secured within the project vault.</p>
                  <button
                    onClick={() => setVaultModalOpen(true)}
                    className="mt-4 px-3 py-1.5 rounded-lg border border-brand-blue text-brand-blue text-xs font-bold hover:bg-brand-blue-light transition-all"
                  >
                    Add First Credential
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {credentials.map((cred) => {
                    const isVisible = !!revealing[cred._id];
                    const displayedPass = decryptedPasswords[cred._id] || '••••••••';
                    
                    return (
                      <div 
                        key={cred._id} 
                        className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between hover:shadow-glow transition-all duration-300 relative secure-glow-pulse"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-slate-900 text-sm text-left">{cred.site}</h3>
                              {cred.notes && (
                                <p className="text-[10px] text-slate-400 mt-0.5 text-left italic">{cred.notes}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteCredential(cred._id)}
                              className="text-slate-300 hover:text-rose-600 p-1"
                              title="Delete Credential"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 uppercase tracking-wider font-bold text-[9px]">Username</span>
                              <span className="text-slate-700 font-medium select-all">{cred.username}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                              <span className="text-slate-400 uppercase tracking-wider font-bold text-[9px]">Password</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-xs ${isVisible ? 'text-slate-900 font-bold select-all' : 'text-slate-400'}`}>
                                  {displayedPass}
                                </span>
                                <button
                                  onClick={() => handleRevealPassword(cred._id)}
                                  className="text-slate-400 hover:text-brand-blue p-0.5 rounded"
                                >
                                  {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Vault Add Modal */}
              {vaultModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  <div onClick={() => setVaultModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
                  <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Add Credential Entry</h3>
                      <button onClick={() => setVaultModalOpen(false)} className="text-slate-400 p-1"><Plus className="rotate-45" size={18} /></button>
                    </div>

                    <form onSubmit={handleAddCredential} className="p-4 space-y-4">
                      {credError && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded">{credError}</p>}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-left">Website / Site Title</label>
                        <input
                          type="text"
                          required
                          value={newSite}
                          onChange={(e) => setNewSite(e.target.value)}
                          placeholder="e.g. GitHub, AWS Console"
                          className="block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-left">Username</label>
                        <input
                          type="text"
                          required
                          value={newUsername}
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="e.g. dev_admin"
                          className="block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-left">Password</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 text-left">Notes (Optional)</label>
                        <input
                          type="text"
                          value={newCredNotes}
                          onChange={(e) => setNewCredNotes(e.target.value)}
                          placeholder="e.g. Database read-only key"
                          className="block w-full rounded-lg border border-slate-200 px-3 py-1.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs"
                        />
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setVaultModalOpen(false)}
                          className="flex-1 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-1.5 border border-transparent rounded-lg text-xs font-bold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-glow"
                        >
                          Save Entry
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PANEL 3: WIKI NOTES */}
          {activeTab === 'notes' && (
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 text-left">Project Notes & Wiki</h2>
                  <p className="text-xs text-slate-400 mt-0.5 text-left">Keep markdown documentations specific to this project.</p>
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => setPreviewNote(!previewNote)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    {previewNote ? 'Edit Mode' : 'Preview Note'}
                  </button>
                  <button
                    onClick={handleSaveNote}
                    disabled={noteSaving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-xs font-bold hover:bg-brand-blue-dark transition-all shadow-glow disabled:opacity-50"
                  >
                    <Save size={13} />
                    {noteSaving ? 'Saving...' : 'Save Note'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note Title"
                  className="block w-full border-b border-slate-200 py-2 text-slate-950 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden font-bold text-xl transition-all"
                  disabled={previewNote}
                />

                {previewNote ? (
                  <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50/50 p-4 border border-slate-100 rounded-lg text-left leading-relaxed min-h-[300px]">
                    <ReactMarkdown>{noteContent}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    rows={12}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="# Project Guide&#10;&#10;Use markdown to style. E.g.&#10;- **Stack**: Next.js 14, Tailwind&#10;- *Port*: 3000"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm font-mono transition-all min-h-[300px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
