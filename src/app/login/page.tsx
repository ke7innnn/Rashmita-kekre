'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Activity } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        username,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Invalid username or password');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-card p-10 rounded-2xl shadow-sm border border-border">
        <div className="flex flex-col items-center justify-center text-center">
          <img 
            src="/logo/rklogo.png" 
            alt="Health 360 Logo" 
            className="h-16 object-contain mb-2"
          />
          <p className="mt-2 text-sm text-foreground/60">
            Sign in to manage patient records and clinical appointments.
          </p>
        </div>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg text-center font-medium">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-xs">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-foreground/75 mb-1">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden sm:text-sm transition-all"
                placeholder="Username (e.g. rashmita)"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-foreground/75 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder-foreground/30 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background hover:bg-primary-hover focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-hidden disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
