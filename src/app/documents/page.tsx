'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ReactMarkdown from 'react-markdown';
import { 
  Upload, 
  FileText, 
  Search, 
  Trash2, 
  Sparkles, 
  Calendar, 
  HardDrive, 
  ChevronRight,
  Eye,
  AlertCircle
} from 'lucide-react';

interface Document {
  _id: string;
  name: string;
  content: string;
  summary?: string;
  analysis?: string;
  fileType: string;
  size: number;
  createdAt: string;
}

function DocumentsContent() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  
  // Tabs: 'library' or 'upload'
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  
  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRawContent, setShowRawContent] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchDocuments();
    const tabParam = searchParams.get('tab');
    if (tabParam === 'analyze') {
      setActiveTab('upload');
    }
  }, [searchParams]);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
        if (data.length > 0 && !selectedDoc) {
          setSelectedDoc(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load documents', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      // Read the file as text locally
      const reader = new FileReader();
      
      const fileTextContent = await new Promise<string>((resolve, reject) => {
        reader.onload = (event) => resolve(event.target?.result as string || '');
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
      });

      // Submit to endpoint
      const fileExtension = file.name.split('.').pop() || 'txt';
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name,
          content: fileTextContent,
          fileType: fileExtension,
          size: file.size
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process document');
      }

      setDocuments([data, ...documents]);
      setSelectedDoc(data);
      setFile(null);
      
      // Clear file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // Redirect to library tab to show the analysis!
      setActiveTab('library');
      if (searchParams.get('tab') === 'analyze') {
        router.replace('/documents');
      }
    } catch (err: any) {
      setUploadError(err.message || 'Error processing document file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its AI analysis?')) return;
    try {
      const res = await fetch(`/api/documents/${docId}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = documents.filter(d => d._id !== docId);
        setDocuments(remaining);
        if (remaining.length > 0) {
          setSelectedDoc(remaining[0]);
        } else {
          setSelectedDoc(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.summary && d.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Documents Center</h1>
          <p className="text-sm text-slate-500 mt-1">Upload technical documents and generate AI audits with Claude</p>
        </div>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => {
            setActiveTab('library');
            if (searchParams.get('tab') === 'analyze') router.replace('/documents');
          }}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'library' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText size={16} />
          Documents Library
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`pb-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'upload' 
              ? 'border-brand-blue text-brand-blue' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles size={16} />
          Upload & Analyze
        </button>
      </div>

      {/* Panels */}
      <div className="min-h-[400px]">
        {/* PANEL 1: LIBRARY */}
        {activeTab === 'library' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Sidebar list */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search files..."
                  className="block w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden text-xs transition-all"
                />
              </div>

              {filteredDocs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No documents found.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedDoc?._id === doc._id;
                    return (
                      <button
                        key={doc._id}
                        onClick={() => {
                          setSelectedDoc(doc);
                          setShowRawContent(false);
                        }}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all duration-200
                          ${isSelected 
                            ? 'border-brand-blue bg-brand-blue-light/35' 
                            : 'border-slate-100 hover:border-slate-200 bg-slate-50/20'}
                        `}
                      >
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                          <FileText size={16} className={isSelected ? 'text-brand-blue' : 'text-slate-400'} />
                          <span className="font-bold text-slate-800 text-xs truncate block">{doc.name}</span>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Document display */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-lg p-6 space-y-6">
              {selectedDoc ? (
                <div className="space-y-6">
                  {/* Item Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-lg font-bold text-slate-950 text-left">{selectedDoc.name}</h2>
                      <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(selectedDoc.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <HardDrive size={12} />
                          {formatSize(selectedDoc.size)}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDelete(selectedDoc._id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all"
                    >
                      <Trash2 size={13} />
                      Delete File
                    </button>
                  </div>

                  {/* AI Summary Section */}
                  <div className="space-y-3 bg-brand-blue-light/25 border border-brand-blue/10 p-5 rounded-lg">
                    <div className="flex items-center gap-2 text-brand-blue">
                      <Sparkles size={16} className="animate-pulse" />
                      <h3 className="text-xs font-bold uppercase tracking-wider">AI Executive Summary</h3>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed text-left font-medium">
                      {selectedDoc.summary}
                    </p>
                  </div>

                  {/* AI Detailed Takeaways */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-left">Audit Key Takeaways</h3>
                    <div className="prose prose-sm max-w-none text-slate-700 text-left leading-relaxed">
                      <ReactMarkdown>{selectedDoc.analysis || ''}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Collapsible raw text content */}
                  <div className="pt-4 border-t border-slate-100">
                    <button
                      onClick={() => setShowRawContent(!showRawContent)}
                      className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-brand-blue py-2"
                    >
                      <span className="flex items-center gap-1.5">
                        <Eye size={14} />
                        {showRawContent ? 'Hide Raw Document Text' : 'View Raw Document Text'}
                      </span>
                      <span>{showRawContent ? 'Collapse' : 'Expand'}</span>
                    </button>

                    {showRawContent && (
                      <pre className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-4 text-[10px] font-mono text-slate-600 overflow-x-auto max-h-80 leading-relaxed text-left whitespace-pre-wrap">
                        {selectedDoc.content}
                      </pre>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-24 text-center text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">
                  <FileText size={36} className="text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 text-sm">No Document Selected</h3>
                  <p className="text-xs text-slate-400 mt-1">Upload a code layout, server logs, or configurations report to trigger Claude audits.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PANEL 2: UPLOAD & ANALYZE */}
        {activeTab === 'upload' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-lg p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 text-center">Analyze Document</h2>
              <p className="text-xs text-slate-400 mt-1 text-center">
                Upload text documents (.txt, .md, .json, .log). TechPro will parse contents and trigger Claude API summary audits.
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {uploadError}
                </div>
              )}

              {/* Upload box */}
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <Upload size={32} className="text-slate-400 mb-3" />
                <label className="cursor-pointer text-xs font-bold text-brand-blue hover:underline mb-1">
                  Choose file to upload
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.md,.json,.log,.csv,.js,.ts,.tsx,.css"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
                <p className="text-[10px] text-slate-400">Supported formats: TXT, MD, JSON, LOG, JS, TS</p>
                
                {file && (
                  <div className="mt-4 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-md text-xs">
                    <FileText size={14} className="text-brand-blue" />
                    <span className="font-semibold text-slate-700 truncate max-w-xs">{file.name}</span>
                    <span className="text-[10px] text-slate-400">({formatSize(file.size)})</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-hidden disabled:opacity-50 transition-all shadow-glow items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Claude is analyzing content...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Analyze with Claude API
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Documents() {
  return (
    <DashboardLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-brand-blue/20 border-t-brand-blue rounded-lg animate-spin" />
        </div>
      }>
        <DocumentsContent />
      </Suspense>
    </DashboardLayout>
  );
}
