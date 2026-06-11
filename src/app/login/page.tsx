'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [registrationAllowed, setRegistrationAllowed] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Administrator account created! Log in below.');
    }

    async function checkRegistration() {
      try {
        const res = await fetch('/api/auth/register');
        const data = await res.json();
        setRegistrationAllowed(data.registrationAllowed);
      } catch (err) {
        // Silent catch
      }
    }
    checkRegistration();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        throw new Error(res.error || 'Invalid credentials');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold">
          {success}
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-xs font-semibold">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Email address
        </label>
        <div className="mt-1">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm transition-all"
            placeholder="name@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-500">
          Password
        </label>
        <div className="mt-1">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 placeholder-slate-400 focus:border-brand-blue focus:outline-hidden focus:ring-1 focus:ring-brand-blue text-sm transition-all"
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue disabled:opacity-50 transition-all shadow-glow"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div className="text-center text-xs text-slate-500 mt-4">
        Need an account?{' '}
        <Link href="/register" className="font-semibold text-brand-blue hover:underline">
          Register here
        </Link>
      </div>
    </form>
  );
}

export default function Login() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-lg bg-brand-blue flex items-center justify-center text-white font-bold text-2xl shadow-glow">
            T
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
          Sign in to TechPro
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Access your personal project workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-slate-200 rounded-lg sm:px-10 shadow-xs animate-fade-in">
          <Suspense fallback={
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-lg animate-spin" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        <div className="mt-8 text-center text-xs text-slate-400">
          <p>App built by <span className="font-semibold text-slate-500">TechspaceNG</span></p>
          <p className="mt-1">
            Email: <a href="mailto:techspace544@gmail.com" className="hover:underline text-brand-blue transition-colors">techspace544@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
