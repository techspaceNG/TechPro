'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Lock, 
  Search, 
  Trash2, 
  Plus, 
  Eye, 
  EyeOff, 
  FolderKanban, 
  ShieldAlert, 
  ExternalLink,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
}

interface Credential {
  _id: string;
  site: string;
  username: string;
  notes?: string;
  project?: {
    _id: string;
    name: string;
  } | null;
  createdAt: string;
}

export default function Vault() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  
  // Decryption States
  const [decryptedPasswords, setDecryptedPasswords] = useState<{ [key: string]: string }>({});
  const [revealing, setRevealing] = useState<{ [key: string]: boolean }>({});
  
  // Add modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [site, setSite] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [targetProjectId, setTargetProjectId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [credRes, projRes] = await Promise.all([
          fetch('/api/credentials'),
          fetch('/api/projects')
        ]);

        if (credRes.ok && projRes.ok) {
          const credData = await credRes.json();
          const projData = await projRes.json();
          setCredentials(credData);
          setProjects(projData);
        }
      } catch (err) {
        console.error('Failed to load Vault data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!site || !username || !password) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site,
          username,
          password,
          notes,
          project: targetProjectId || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        // Refetch to populate correctly
        const refetchRes = await fetch('/api/credentials');
        const refreshedCreds = await refetchRes.json();
        setCredentials(refreshedCreds);
        
        setSite('');
        setUsername('');
        setPassword('');
        setNotes('');
        setTargetProjectId('');
        setModalOpen(false);
      } else {
        setError(data.error || 'Failed to create vault entry');
      }
    } catch (err) {
      setError('Error creating vault entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReveal = async (credId: string) => {
    if (decryptedPasswords[credId]) {
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

  const handleDelete = async (credId: string) => {
    if (!confirm('Are you sure you want to delete this credential? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/credentials/${credId}`, { method: 'DELETE' });
      if (res.ok) {
        setCredentials(credentials.filter(c => c._id !== credId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCreds = credentials.filter(c => {
    const matchesSearch = c.site.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = selectedProjectId === 'all' || 
                           (selectedProjectId === 'global' && !c.project) ||
                           (c.project && c.project._id === selectedProjectId);
                           
    return matchesSearch && matchesProject;
  });

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
      <div className="space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Secure Vault</h1>
            <p className="text-sm text-slate-500 mt-1">Central credentials vault. Cryptographically guarded.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-all shadow-glow self-start sm:self-auto"
          >
            <Plus size={16} />
            Add Credential
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 secure-glow-pulse">
          <div className="flex items-start sm:items-center gap-3">
            <ShieldCheck className="text-brand-blue mt-0.5 sm:mt-0 flex-shrink-0" size={20} />
            <div className="space-y-1 sm:space-y-0">
              <span className="font-bold text-sm block sm:inline mr-2">AES-256-GCM Guard Active:</span>
              <span className="text-xs text-slate-400">All passwords are encrypted in MongoDB and verified on decryption request.</span>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-slate-200 rounded-lg p-4">
          <div className="sm:col-span-2 relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search credentials by website or username..."
              className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-blue focus:outline-hidden text-xs bg-white transition-all appearance-none"
            >
              <option value="all">All Projects</option>
              <option value="global">Global Credentials</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Vault listing */}
        {filteredCreds.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-16 text-center">
            <Lock size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-950">No credentials found</h3>
            <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
              Store site login credentials or server API keys. Match them to specific projects or keep them global.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreds.map((cred) => {
              const isVisible = !!revealing[cred._id];
              const displayedPass = decryptedPasswords[cred._id] || '••••••••';
              
              return (
                <div 
                  key={cred._id} 
                  className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col justify-between hover:shadow-glow transition-all duration-300 relative secure-glow-pulse"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm text-left leading-snug">{cred.site}</h3>
                        {cred.notes && (
                          <p className="text-[10px] text-slate-400 mt-0.5 italic text-left">{cred.notes}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleDelete(cred._id)}
                        className="text-slate-300 hover:text-rose-600 p-1 flex-shrink-0"
                        title="Delete Entry"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Inputs panel */}
                    <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 uppercase tracking-wider font-bold text-[9px]">Username</span>
                        <span className="text-slate-700 font-medium select-all">{cred.username}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                        <span className="text-slate-400 uppercase tracking-wider font-bold text-[9px]">Password</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono text-xs ${isVisible ? 'text-slate-900 font-bold select-all' : 'text-slate-400'}`}>
                            {displayedPass}
                          </span>
                          <button
                            onClick={() => handleReveal(cred._id)}
                            className="text-slate-400 hover:text-brand-blue p-0.5 rounded"
                          >
                            {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Tag */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 uppercase tracking-wider font-bold">Scope</span>
                    {cred.project ? (
                      <Link 
                        href={`/projects/${cred.project._id}`}
                        className="font-bold text-brand-blue hover:underline flex items-center gap-1"
                      >
                        <FolderKanban size={10} />
                        {cred.project.name}
                      </Link>
                    ) : (
                      <span className="text-slate-500 font-semibold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-sm">Global</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div onClick={() => setModalOpen(false)} className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" />
            <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Add Credential Entry</h3>
                <button onClick={() => setModalOpen(false)} className="text-slate-400 p-1"><Plus className="rotate-45" size={20} /></button>
              </div>

              <form onSubmit={handleCreate} className="p-6 space-y-5">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <ShieldAlert size={14} />
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">Website / Site Title</label>
                  <input
                    type="text"
                    required
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="e.g. GitHub Workspace"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. technical_lead"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. AWS root account token"
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 text-left">Scope / Project mapping</label>
                  <select
                    value={targetProjectId}
                    onChange={(e) => setTargetProjectId(e.target.value)}
                    className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:border-brand-blue focus:outline-hidden text-sm bg-white"
                  >
                    <option value="">Keep Global (No project mapping)</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 border border-transparent rounded-lg text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark shadow-glow disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
