'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, UserPlus, Shield, Clock, FileText, AlertTriangle, AlertCircle, Copy, Check, ExternalLink, Power
} from 'lucide-react';

export default function StaffSettingsTab() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);

  // Invite Form state
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [designation, setDesignation] = useState<string>('Physiotherapist');
  const [role, setRole] = useState<string>('PHYSIO');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [inviting, setInviting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/staff');
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.staff || []);
        setInvites(data.pendingInvites || []);
      }
    } catch (e) {
      console.error('Error fetching staff list:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Name and email are required');
      return;
    }

    setInviting(true);
    setError(null);

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, designation, role })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate invite');
      }

      const data = await res.json();
      setGeneratedLink(data.inviteUrl);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Error generating staff invite');
    } finally {
      setInviting(false);
    }
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-white/50 text-sm">Loading staff members...</div>;
  }

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-[#12D6C4]" /> Clinic Staff Management
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Accounts for Dr. Gachchami Ghaiwat, Dr. Pritee Yadav, and staff members
          </p>
        </div>
        <button
          onClick={() => {
            setGeneratedLink(null);
            setError(null);
            setShowInviteModal(true);
          }}
          className="px-4 py-2 rounded-xl bg-[#12D6C4] hover:bg-[#009FC7] text-black text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 shadow-[0_0_15px_rgba(18,214,196,0.3)]"
        >
          <UserPlus className="w-4 h-4" /> Add Staff Member
        </button>
      </div>

      {/* Staff Members List */}
      <div className="bg-[#0B0A10]/80 border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
        {staffList.map((member) => (
          <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02]">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[#12D6C4]/15 border border-[#12D6C4]/30 flex items-center justify-center font-bold text-[#12D6C4] text-sm shrink-0">
                {member.username.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">{member.username}</h4>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    member.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {member.role}
                  </span>
                  {!member.isActive && (
                    <span className="text-[10px] font-bold text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      Deactivated
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50">{member.designation || 'Staff'} · {member.email || 'No email'}</p>
              </div>
            </div>

            {/* Documents & Expiry Badges */}
            <div className="flex items-center gap-3">
              {member.expiredCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full">
                  <AlertCircle className="w-3.5 h-3.5" /> {member.expiredCount} Expired Doc
                </span>
              )}
              {member.expiringCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> {member.expiringCount} Expiring Soon
                </span>
              )}

              <Link
                href={`/crm360/staff/${member.id}`}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/80 transition flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#12D6C4]" /> Profile & Documents ({member._count?.documents || 0})
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0F0D16] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#12D6C4]" /> Invite Staff Member
            </h3>

            {generatedLink ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" /> Single-use invite link created (valid for 7 days).
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1.5">WhatsApp / Copy Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none select-all"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3 py-2 bg-[#12D6C4] text-black text-xs font-bold rounded-xl hover:bg-[#009FC7] transition flex items-center gap-1.5 shrink-0"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/80 hover:bg-white/5 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateInvite} className="space-y-3">
                {error && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Pritee Yadav"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="dr.pritee@health360.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/70 mb-1">Designation</label>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#12D6C4]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-white/70"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={inviting}
                    className="flex-1 py-2.5 rounded-xl bg-[#12D6C4] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#009FC7]"
                  >
                    {inviting ? 'Generating...' : 'Generate Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
