// Login / Sign Up — Google account or manual email details
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setSession, googleEnabled, getCachedUser, refreshMe } from '../auth.ts';

const API = 'http://localhost:5000';

export default function LoginSignup() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleOn, setGoogleOn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // already logged in? go to profile
    refreshMe().then((u) => { if (u) navigate('/profile'); });
    googleEnabled().then(setGoogleOn);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      if (form.full_name.trim().length < 2) return setError('Please enter your full name');
      if (form.password.length < 8) return setError('Password must be at least 8 characters');
      if (form.password !== form.confirm) return setError('Passwords do not match');
    }
    setBusy(true);
    try {
      const res = await fetch(`${API}/api/web-auth/${mode === 'signup' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'signup'
          ? { full_name: form.full_name, email: form.email, password: form.password }
          : { email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.');
      } else {
        setSession(data.token, data.user);
        navigate('/profile');
      }
    } catch {
      setError('Could not reach the server. Is the backend running?');
    } finally {
      setBusy(false);
    }
  };

  const startGoogle = () => {
    window.location.href = `${API}/api/web-auth/google`;
  };

  const field = (key: 'full_name' | 'email' | 'password' | 'confirm', label: string, type = 'text') => (
    <input
      type={type}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      placeholder={label}
      className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm w-full"
    />
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src="/task-buddy-logo.png" alt="Task Buddy" className="h-14 mb-2" />
          <h1 className="text-2xl font-extrabold text-buddy-dark dark:text-white">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
        </div>

        {/* mode tabs */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 mb-6">
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`py-2.5 rounded-xl font-extrabold text-sm transition ${mode === m ? 'bg-buddy-blue text-white shadow' : 'text-gray-500 dark:text-gray-400'}`}
            >
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Google */}
        <button
          onClick={startGoogle}
          disabled={!googleOn}
          title={googleOn ? '' : 'Google sign-in is not configured on the server yet'}
          className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl border-2 font-bold text-sm transition ${googleOn ? 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-white' : 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'}`}
        >
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.3-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.2 5.2C41 35.3 44 30.1 44 24c0-1.2-.1-2.3-.4-3.5z"/></svg>
          Continue with Google
        </button>
        {!googleOn && (
          <p className="text-[11px] text-gray-400 text-center mt-1">
            (Google sign-in activates once GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set in backend/.env — email sign-up works right now)
          </p>
        )}

        <div className="flex items-center gap-3 my-5">
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
          <span className="text-[11px] text-gray-400 font-bold">OR WITH EMAIL</span>
          <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === 'signup' && field('full_name', 'Full name')}
          {field('email', 'Email address', 'email')}
          {field('password', mode === 'signup' ? 'Password (min. 8 characters)' : 'Password', 'password')}
          {mode === 'signup' && field('confirm', 'Confirm password', 'password')}
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="bg-buddy-orange hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-extrabold text-sm transition mt-2"
          >
            {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          <Link to="/" className="hover:text-buddy-blue">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
