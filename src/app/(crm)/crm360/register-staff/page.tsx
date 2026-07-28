'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Key, User, Check, AlertCircle } from 'lucide-react';

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [validating, setValidating] = useState<boolean>(true);
  const [invite, setInvite] = useState<any>(null);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      validateInvite();
    } else {
      setError('Missing invite token in URL.');
      setValidating(false);
    }
  }, [token]);

  const validateInvite = async () => {
    try {
      const res = await fetch(`/api/staff/invite?token=${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid invite link');
      setInvite(data.invite);
      if (data.invite?.email) {
        setUsername(data.invite.email.split('@')[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invite link.');
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/staff/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, username, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete registration');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/crm360/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error registering account');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen bg-[#0A0711] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#12D6C4] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-white/50">Validating invite link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0711] text-white flex items-center justify-center p-4 selection:bg-[#12D6C4]/30 select-none">
      <div className="w-full max-w-md bg-[#0F0D16] border border-white/10 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[#12D6C4]/15 border border-[#12D6C4]/30 flex items-center justify-center mx-auto text-[#12D6C4]">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold">Health 360 Staff Setup</h1>
          {invite && (
            <p className="text-xs text-white/50">
              Welcome {invite.name} ({invite.designation})
            </p>
          )}
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-center space-y-2">
            <Check className="w-8 h-8 mx-auto text-emerald-400" />
            <h3 className="text-sm font-bold">Account Created Successfully!</h3>
            <p className="text-xs text-white/60">Redirecting to login screen...</p>
          </div>
        ) : (
          invite && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Choose Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/70 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#12D6C4]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-[#12D6C4] hover:bg-[#009FC7] text-black text-xs font-bold uppercase tracking-wider transition shadow-[0_0_20px_rgba(18,214,196,0.25)]"
              >
                {submitting ? 'Creating Account...' : 'Complete Account Setup'}
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}

export default function RegisterStaffPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0711] text-white flex items-center justify-center p-4">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
