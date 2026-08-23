'use client';

import { ArrowRight } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export default function AuthPage() {
  const router = useRouter();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await signup(form);
      const next = new URLSearchParams(window.location.search).get('next');
      router.push(next?.startsWith('/') && !next.startsWith('//') ? next : '/account');
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }

  return <div className="auth-shell"><div className="auth-visual"><div className="auth-quote"><p className="eyebrow">Welcome to Stage</p><h2>The night is better when you know where to look.</h2></div></div><div className="auth-panel"><div className="auth-form"><p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Join the crowd'}</p><h1>{mode === 'login' ? 'Sign in.' : 'Create account.'}</h1><p>{mode === 'login' ? 'Your saved events and tickets are waiting.' : 'Save events, follow artists and keep every ticket together.'}</p><form onSubmit={submit}>{mode === 'signup' && <div className="field"><label>Full name</label><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" /></div>}<div className="field"><label>Email address</label><input className="input" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></div>{mode === 'signup' && <div className="field"><label>Phone <span className="muted">(optional)</span></label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /></div>}<div className="field"><label>Password</label><input className="input" required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>{error && <div className="notice error-notice">{error}</div>}<button disabled={busy} className="button button-primary button-block">{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><div className="auth-switch">{mode === 'login' ? 'New to Stage?' : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></div></div></div></div>;
}
