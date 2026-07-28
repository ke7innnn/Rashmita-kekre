'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, FileText, UploadCloud, Trash2, Download, AlertCircle, AlertTriangle, CheckCircle2, Shield, Calendar, Clock
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Degree Certificate',
  'Council Registration',
  'ID Proof',
  'Address Proof',
  'Employment Contract',
  'Insurance',
  'Other'
];

export default function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = use(params);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Form state
  const [fileName, setFileName] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>(DOCUMENT_TYPES[0]);
  const [issueDate, setIssueDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [staffId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${staffId}/documents`);
      if (res.status === 403) {
        setError('Forbidden. You do not have permission to view this staff member’s documents.');
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error('Failed to load documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
      setFileName(file.name);
      setFileUrl(`https://placeholder.com/docs/${encodeURIComponent(file.name)}`);
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl || !documentType) {
      setUploadError('Please select a file and document type.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const res = await fetch(`/api/staff/${staffId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileUrl,
          fileSize: 1024 * 250, // ~250 KB
          mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
          documentType,
          issueDate: issueDate || null,
          expiryDate: expiryDate || null,
          notes: notes || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload document');
      }

      setFileName('');
      setFileUrl('');
      setNotes('');
      fetchDocuments();
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/staff/${staffId}/documents?documentId=${documentId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchDocuments();
      }
    } catch (e) {
      console.error('Error deleting document:', e);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-40 bg-white/5 animate-pulse rounded-lg" />
        <div className="h-64 bg-white/[0.03] border border-white/10 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
        <Link href="/crm360/settings" className="text-xs text-[#12D6C4] underline">
          Return to Clinic Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 selection:bg-[#12D6C4]/30 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
          <Link href="/crm360/settings" className="hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
          </Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Shield className="w-7 h-7 text-[#12D6C4]" />
          Staff Document Vault
        </h1>
      </div>

      {/* Grid Layout: Left Upload Form (1/3), Right Document List (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Upload Form (Left) */}
        <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-[#12D6C4]" /> Upload New Document
          </h3>

          {uploadError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
              {uploadError}
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Document Type</label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
              >
                {DOCUMENT_TYPES.map(t => (
                  <option key={t} value={t} className="bg-[#0F0D16] text-white">{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Select File (PDF / Images, Max 10MB)</label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleSimulatedFileUpload}
                className="w-full text-xs text-white/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#12D6C4]/20 file:text-[#12D6C4] hover:file:bg-[#12D6C4]/30"
              />
            </div>

            {fileName && (
              <div className="p-2 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-[#12D6C4] truncate">
                Selected: {fileName}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-white/60 mb-1">Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#12D6C4] mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/70 mb-1">Notes</label>
              <input
                type="text"
                placeholder="Optional notes or registration number..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || !fileName}
              className="w-full py-2.5 rounded-xl bg-[#12D6C4] hover:bg-[#009FC7] text-black text-xs font-bold uppercase tracking-wider transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </form>
        </div>

        {/* Document List (Right 2/3) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#12D6C4]" /> Uploaded Documents ({documents.length})
          </h3>

          {documents.length === 0 ? (
            <div className="p-8 text-center bg-[#0B0A10]/60 border border-white/10 rounded-2xl text-xs text-white/40">
              No staff documents uploaded yet.
            </div>
          ) : (
            <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-xl">
              {documents.map((doc) => (
                <div key={doc.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{doc.fileName}</span>
                      <span className="text-[10px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">
                        {doc.documentType}
                      </span>

                      {/* Expiry Tracking Badges */}
                      {doc.isExpired && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> EXPIRED
                        </span>
                      )}
                      {doc.isExpiringSoon && !doc.isExpired && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" /> Expires in {doc.daysRemaining} days
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-white/40">
                      Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}
                      {doc.expiryDate && ` · Expires: ${new Date(doc.expiryDate).toLocaleDateString('en-IN')}`}
                    </p>
                    {doc.notes && <p className="text-[11px] text-white/60 italic">{doc.notes}</p>}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition"
                      title="Download/View"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
