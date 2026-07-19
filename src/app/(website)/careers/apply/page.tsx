'use client';

import { useState, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, X, ArrowLeft, Briefcase } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import './apply.css';

function ApplyForm() {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'Open Position';

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [dragging, setDragging] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const ACCEPTED = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFile = (f: File) => {
    if (!ACCEPTED.includes(f.type)) {
      setError('Please upload a PDF or Word document (.pdf, .doc, .docx).');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  }, []);

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Please upload your CV before submitting.'); return; }
    if (!name.trim() || !email.trim()) { setError('Please fill in all fields.'); return; }
    
    setSubmitting(true);
    setError('');

    try {
      // 1. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${name.replace(/\s+/g, '_')}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('health360_documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error('Failed to upload CV. Please try again.');
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('health360_documents')
        .getPublicUrl(filePath);

      // 3. Submit to Inbox
      const res = await fetch('/api/public/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'CAREERS',
          name,
          email,
          phone: '',
          message: `Applying for: ${role}`,
          metadata: JSON.stringify({ role }),
          attachmentUrl: publicUrl
        })
      });

      if (!res.ok) throw new Error('Failed to submit application.');
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="apply-main">
      <div className="apply-container">

        <AnimatePresence mode="wait">
          {submitted ? (
            /* ── Success State ── */
            <motion.div
              key="success"
              className="apply-success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <motion.div
                className="success-icon-wrap"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 20 }}
              >
                <CheckCircle size={48} strokeWidth={1.5} />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                Application Received!
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="success-desc"
              >
                Thank you, <strong>{name}</strong>. We've received your CV for the{' '}
                <strong>{role}</strong> role. Our team will review your application and reach out
                to <strong>{email}</strong> within 5–7 business days.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <Link href="/careers" className="apply-back-btn">
                  <ArrowLeft size={16} /> Back to Careers
                </Link>
              </motion.div>
            </motion.div>

          ) : (
            /* ── Form State ── */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Back link */}
              <Link href="/careers" className="apply-back-link">
                <ArrowLeft size={15} /> Back to Careers
              </Link>

              {/* Header */}
              <div className="apply-header">
                <div className="apply-role-badge">
                  <Briefcase size={14} /> {role}
                </div>
                <h1 className="apply-title">Apply for this role</h1>
                <p className="apply-subtitle">
                  Upload your CV and we'll be in touch. Takes less than 2 minutes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="apply-form" noValidate>

                {/* Name */}
                <div className="apply-field">
                  <label htmlFor="apply-name">Full Name</label>
                  <input
                    id="apply-name"
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>

                {/* Email */}
                <div className="apply-field">
                  <label htmlFor="apply-email">Email Address</label>
                  <input
                    id="apply-email"
                    type="email"
                    placeholder="e.g. priya@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                {/* CV Upload */}
                <div className="apply-field">
                  <label>Upload CV / Resume</label>
                  <div
                    className={`apply-dropzone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
                    onClick={() => !file && inputRef.current?.click()}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && !file && inputRef.current?.click()}
                    aria-label="CV upload area"
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                    />

                    {file ? (
                      <div className="dropzone-file-info">
                        <FileText size={28} strokeWidth={1.5} />
                        <div>
                          <p className="file-name">{file.name}</p>
                          <p className="file-size">{(file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button
                          type="button"
                          className="file-remove"
                          onClick={e => { e.stopPropagation(); setFile(null); }}
                          aria-label="Remove file"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="dropzone-placeholder">
                        <Upload size={32} strokeWidth={1.25} />
                        <p><strong>Drag & drop</strong> your CV here</p>
                        <p className="dropzone-sub">or <span className="dropzone-browse">browse file</span></p>
                        <p className="dropzone-hint">PDF, DOC, DOCX — max 5 MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.p
                    className="apply-error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {error}
                  </motion.p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  className={`apply-submit-btn ${submitting ? 'loading' : ''}`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="apply-spinner" />
                  ) : (
                    'Submit Application'
                  )}
                </button>

              </form>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}

export default function ApplyPage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
        <ApplyForm />
      </Suspense>
      <Footer />
    </>
  );
}
