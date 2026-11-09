'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, ArrowRight, BarChart3, LockKeyhole, UsersRound } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { StageBadge, StageWordmark } from '@/components/brand-logo';

function nextPath() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/admin') && !next.startsWith('//') && next !== '/admin/login' ? next : '/admin';
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { user, ready, login, logout } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Already signed in as a super admin → straight to the console.
  useEffect(() => {
    if (ready && user?.role === 'admin') router.replace(nextPath());
  }, [ready, user, router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const signedIn = await login(form.email.trim(), form.password);
      if (signedIn.role !== 'admin') {
        // A valid organizer/guest account must not keep a session from here.
        logout();
        setError('This account doesn’t have super admin access.');
        return;
      }
      router.replace(nextPath());
    } catch (err) {
      setError((err as Error).message || 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="adm-login">
      <section className="adm-login-visual">
        <div className="adm-brand" style={{ padding: 0 }}>
          <StageBadge className="adm-brand-badge" />
          <span className="adm-brand-copy"><StageWordmark className="adm-brand-word" /><span>Super admin</span></span>
        </div>
        <div>
          <h2>Everything happening on Stage, in one place.</h2>
          <p>Traffic, sign-ins, organizers and every change made across the website and the app — monitored live.</p>
        </div>
        <div className="adm-login-points">
          <div className="adm-login-point"><BarChart3 size={18} /><strong>Live traffic</strong>Views, unique visitors and the events people open most.</div>
          <div className="adm-login-point"><UsersRound size={18} /><strong>Accounts</strong>Create organizers and admins, suspend or reset access.</div>
          <div className="adm-login-point"><Activity size={18} /><strong>Audit trail</strong>Every sign-in, edit and admin action, with who and when.</div>
        </div>
      </section>
      <section className="adm-login-panel">
        <form className="adm-login-form" onSubmit={submit}>
          <Link className="adm-login-back" href="/"><ArrowLeft size={14} />Back to the website</Link>
          <div className="adm-eyebrow"><LockKeyhole size={13} />Restricted area</div>
          <h1>Super admin sign in</h1>
          <p>Use the super admin account issued to you. Organizer accounts sign in from the organizer studio.</p>
          <div className="adm-field">
            <label htmlFor="adm-email">Email address</label>
            <input id="adm-email" className="adm-input" type="email" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="adm-field">
            <label htmlFor="adm-password">Password</label>
            <input id="adm-password" className="adm-input" type="password" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div className="adm-notice" role="alert">{error}</div>}
          <button className="adm-btn adm-btn-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to the console'}<ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}
