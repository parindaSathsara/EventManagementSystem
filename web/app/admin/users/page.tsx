'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Ban, CheckCircle2, KeyRound, PencilLine, Plus, Search, Trash2, UsersRound } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { type Role, type UserList, adminApi, full, shortDate, timeAgo, dateTime } from '@/lib/admin';
import { AdminAvatar, Empty, Pager, RoleBadge, StatusBadge, VerifiedMark, useToast } from '@/components/admin/ui';
import { useUserActions } from '@/components/admin/user-actions';

const TAKE = 25;
const ROLE_TABS: Array<{ value: Role | ''; label: string }> = [
  { value: '', label: 'Everyone' },
  { value: 'artist', label: 'Organizers' },
  { value: 'admin', label: 'Super admins' },
  { value: 'customer', label: 'Guest accounts' },
];

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState<Role | ''>('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('newest');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [data, setData] = useState<UserList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // Deep links from the dashboard (?role=artist, ?new=1).
  const [openCreate, setOpenCreate] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get('role');
    if (r === 'artist' || r === 'admin' || r === 'customer') setRole(r);
    if (params.get('new') === '1') setOpenCreate(true);
    setHydrated(true);
  }, []);

  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setSkip(0); }, [role, status, sort, query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminApi.users({ q: query, role, status, sort, take: TAKE, skip }));
      setError('');
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [query, role, status, sort, skip]);
  useEffect(() => { if (hydrated) load(); }, [load, hydrated]);

  const actions = useUserActions({ onChanged: () => load(), notify: toast.show });
  useEffect(() => { if (openCreate) { actions.create(); setOpenCreate(false); } }, [openCreate, actions]);

  const totalAll = data ? Object.values(data.counts).reduce((s, n) => s + (n || 0), 0) : 0;

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">Users & access</div>
          <h1>Accounts</h1>
          <p>Create organizer and admin accounts, see who signs in, and suspend or reset access.</p>
        </div>
        <div className="adm-head-actions">
          <button type="button" className="adm-btn adm-btn-primary" onClick={actions.create}><Plus size={16} />Create account</button>
        </div>
      </div>

      <div className="adm-chips" role="group" aria-label="Filter by role">
        {ROLE_TABS.map((t) => (
          <button key={t.label} type="button" className="adm-chip" aria-pressed={role === t.value} onClick={() => setRole(t.value)}>
            {t.label}<em>{data ? full(t.value ? data.counts[t.value] || 0 : totalAll) : '–'}</em>
          </button>
        ))}
      </div>

      <section className="adm-card adm-card-flush">
        <div className="adm-toolbar" style={{ padding: 16, borderBottom: '1px solid var(--adm-line)' }}>
          <div className="adm-search"><Search size={16} /><input className="adm-input" placeholder="Search name, email, phone or @handle" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search accounts" /></div>
          <select className="adm-select" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">Any status</option><option value="active">Active</option><option value="disabled">Suspended</option>
          </select>
          <select className="adm-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="newest">Newest first</option><option value="last_login">Recently signed in</option><option value="most_logins">Most sign-ins</option><option value="name">Name A–Z</option>
          </select>
        </div>

        {error && <div style={{ padding: 16 }}><div className="adm-notice">{error}</div></div>}
        <div className="adm-table-wrap" style={{ opacity: loading && data ? 0.55 : 1, transition: 'opacity .2s ease' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Account</th><th>Type</th><th>Organizer profile</th><th>Status</th><th>Sign-ins</th><th>Joined</th><th className="adm-right">Actions</th></tr>
            </thead>
            <tbody>
              {!data && loading && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={7}><div className="adm-skel" style={{ height: 30 }} /></td></tr>)}
              {data?.items.map((u) => {
                const self = u.id === me?.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <Link className="adm-cell-user" href={`/admin/users/${u.id}`}>
                        <AdminAvatar name={u.name} src={u.avatarUrl} />
                        <span className="adm-cell-copy"><strong>{u.name}{self && <span className="adm-muted" style={{ fontWeight: 600 }}> (you)</span>}</strong><span>{u.email}</span></span>
                      </Link>
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td>
                      {u.artist ? (
                        <span className="adm-cell-copy">
                          <strong style={{ display: 'flex', alignItems: 'center', gap: 5 }}>@{u.artist.handle}{u.artist.isVerified && <VerifiedMark />}</strong>
                          <span>{u.artist._count.events} events · {full(u.artist.followerCount)} followers{u.artist.isPreferred ? ' · preferred' : ''}</span>
                        </span>
                      ) : <span className="adm-muted">—</span>}
                    </td>
                    <td><StatusBadge disabled={!!u.disabledAt} /></td>
                    <td title={u.lastLoginAt ? `Last sign-in ${dateTime(u.lastLoginAt)}` : 'Never signed in'}>
                      <span className="adm-cell-copy"><strong className="adm-num">{full(u.loginCount)}</strong><span>{u.lastLoginAt ? `last ${timeAgo(u.lastLoginAt).toLowerCase()}` : 'never'}</span></span>
                    </td>
                    <td className="adm-text-2 adm-nowrap">{shortDate(u.createdAt)}</td>
                    <td>
                      <div className="adm-row-actions">
                        <button type="button" className="adm-btn adm-btn-ghost adm-icon-btn" title="Edit" aria-label={`Edit ${u.name}`} onClick={() => actions.edit(u)}><PencilLine size={15} /></button>
                        <button type="button" className="adm-btn adm-btn-ghost adm-icon-btn" title="Reset password" aria-label={`Reset password for ${u.name}`} onClick={() => actions.reset(u)}><KeyRound size={15} /></button>
                        {!self && <button type="button" className="adm-btn adm-btn-ghost adm-icon-btn" title={u.disabledAt ? 'Reactivate' : 'Suspend'} aria-label={`${u.disabledAt ? 'Reactivate' : 'Suspend'} ${u.name}`} onClick={() => actions.toggleSuspend(u)}>{u.disabledAt ? <CheckCircle2 size={15} /> : <Ban size={15} />}</button>}
                        {!self && <button type="button" className="adm-btn adm-btn-ghost adm-icon-btn" title="Delete" aria-label={`Delete ${u.name}`} onClick={() => actions.remove(u)}><Trash2 size={15} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data && data.items.length === 0 && <Empty icon={<UsersRound />} title="No accounts match" copy={query ? 'Try a different name, email or handle.' : 'Create the first account with the button above.'} />}
        {data && <Pager skip={skip} take={TAKE} total={data.total} onPage={setSkip} />}
      </section>
      {actions.node}
      {toast.node}
    </div>
  );
}
