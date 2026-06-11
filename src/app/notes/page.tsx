'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ReactMarkdown from 'react-markdown';
import { 
  Plus, 
  Search, 
  StickyNote, 
  Trash2, 
  Save, 
  FolderKanban, 
  Check,
  Eye,
  EyeOff
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  isGlobal: boolean;
  project?: {
    _id: string;
    name: string;
  } | null;
  updatedAt: string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  
  // Editor form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [notesRes, projRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/projects')
        ]);

        if (notesRes.ok && projRes.ok) {
          const notesData = await notesRes.json();
          const projData = await projRes.json();
          setNotes(notesData);
          setProjects(projData);
          
          if (notesData.length > 0) {
            selectNote(notesData[0]);
          }
        }
      } catch (err) {
        console.error('Error loading notes workspace', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsGlobal(note.isGlobal);
    setSelectedProjectId(note.project?._id || '');
    setPreviewMode(false);
  };

  const handleCreateNewNote = () => {
    const newNoteTemplate: Note = {
      _id: 'new',
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing in Markdown...',
      isGlobal: true,
      project: null,
      updatedAt: new Date().toISOString()
    };
    setSelectedNote(newNoteTemplate);
    setTitle(newNoteTemplate.title);
    setContent(newNoteTemplate.content);
    setIsGlobal(true);
    setSelectedProjectId('');
    setPreviewMode(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);

    try {
      const isNew = selectedNote?._id === 'new';
      const url = isNew ? '/api/notes' : `/api/notes/${selectedNote?._id}`;
      const method = isNew ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          isGlobal,
          project: isGlobal ? null : selectedProjectId || null
        })
      });

      const savedNote = await res.json();
      if (res.ok) {
        // Refetch notes to populate populates correctly and sort list
        const refetchRes = await fetch('/api/notes');
        const refreshedNotes = await refetchRes.json();
        setNotes(refreshedNotes);
        
        // Match selection
        const matchingNote = refreshedNotes.find((n: Note) => n.title === savedNote.title && n.content === savedNote.content) || savedNote;
        setSelectedNote(matchingNote);
      } else {
        alert(savedNote.error || 'Failed to save note');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (noteId === 'new') {
      setSelectedNote(notes[0] || null);
      if (notes[0]) selectNote(notes[0]);
      return;
    }

    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = notes.filter(n => n._id !== noteId);
        setNotes(remaining);
        if (remaining.length > 0) {
          selectNote(remaining[0]);
        } else {
          setSelectedNote(null);
          setTitle('');
          setContent('');
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Notes Workspace</h1>
            <p className="text-sm text-slate-500 mt-1">Manage global readmes and project documentation wikis</p>
          </div>
          <button
            onClick={handleCreateNewNote}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue-dark transition-all shadow-glow self-start sm:self-auto"
          >
            <Plus size={16} />
            Create Note
          </button>
        </div>

        {/* Workspace Dual Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT PANEL: LISTING */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs transition-all"
              />
            </div>

            {/* List */}
            {filteredNotes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs leading-relaxed">
                No notes found. Create a new markdown note to get started.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredNotes.map((note) => {
                  const isSelected = selectedNote?._id === note._id;
                  return (
                    <button
                      key={note._id}
                      onClick={() => selectNote(note)}
                      className={`
                        w-full flex flex-col p-3 rounded-lg border text-left transition-all duration-200
                        ${isSelected 
                          ? 'border-brand-blue bg-brand-blue-light/35 shadow-xs' 
                          : 'border-slate-100 hover:border-slate-200 bg-slate-50/20'}
                      `}
                    >
                      <div className="flex justify-between items-start gap-2 w-full">
                        <span className="font-bold text-slate-800 text-xs truncate">{note.title}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md flex-shrink-0 ${
                          note.isGlobal 
                            ? 'bg-slate-100 text-slate-500' 
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {note.isGlobal ? 'Global' : 'Project'}
                        </span>
                      </div>
                      
                      {note.project && (
                        <span className="text-[9px] font-bold text-brand-blue mt-1 flex items-center gap-1">
                          <FolderKanban size={10} />
                          {note.project.name}
                        </span>
                      )}

                      <p className="text-[10px] text-slate-400 line-clamp-1 mt-1.5 leading-normal">
                        {note.content.replace(/[#*`_-]/g, '')}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT PANEL: EDITOR */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
            {selectedNote ? (
              <div className="space-y-6">
                {/* Editor Header Controls */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Destination Select (Global vs Project) */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Type:</span>
                      <button
                        onClick={() => setIsGlobal(true)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          isGlobal 
                            ? 'bg-slate-100 text-slate-800 border border-slate-200' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Global
                      </button>
                      <button
                        onClick={() => setIsGlobal(false)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                          !isGlobal 
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        Link Project
                      </button>
                    </div>

                    {/* Project mapping dropdown */}
                    {!isGlobal && (
                      <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold focus:border-brand-blue focus:outline-hidden bg-white text-slate-600"
                      >
                        <option value="">Select Target Project...</option>
                        {projects.map(p => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Save/Delete buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50"
                    >
                      {previewMode ? <EyeOff size={13} /> : <Eye size={13} />}
                      {previewMode ? 'Edit' : 'Preview'}
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-bold hover:bg-brand-blue-dark shadow-glow disabled:opacity-50"
                    >
                      <Save size={13} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      onClick={() => handleDelete(selectedNote._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete Note"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title"
                    className="block w-full border-b border-slate-200 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden font-bold text-xl transition-all"
                    disabled={previewMode}
                  />

                  {previewMode ? (
                    <div className="prose prose-sm max-w-none text-slate-700 bg-slate-50/50 p-4 border border-slate-100 rounded-lg text-left leading-relaxed min-h-[300px]">
                      <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                  ) : (
                    <textarea
                      rows={14}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="# Markdown Documentation&#10;&#10;Styles markdown guide list.&#10;- *Italics*&#10;- **Bolds**"
                      className="block w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-xs font-mono transition-all min-h-[300px]"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
                <StickyNote size={36} className="text-slate-300 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-sm">No Note Selected</h3>
                <p className="text-xs text-slate-400 mt-1">Select an existing note from the sidebar or click Create Note to begin coding your wiki document.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
