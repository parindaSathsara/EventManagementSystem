'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Ban, CalendarDays, CalendarPlus, CheckCircle2, ExternalLink, Eye, ImageUp, KeyRound, LogIn, PencilLine, ShieldAlert, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { type UserDetail, adminApi, dateTime, full, shortDate, timeAgo } from '@/lib/admin';
import { mediaUrl } from '@/lib/format';
import { ActivityRow, AdminAvatar, Empty, EventStatusBadge, RoleBadge, StatTile, StatusBadge, VerifiedMark, useToast } from '@/components/admin/ui';
import { useUserActions } from '@/components/admin/user-actions';

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<UserDetail | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setData(await adminApi.user(id)); setError(''); }
    catch (err) { setError((err as Error).message); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const actions = useUserActions({ onChanged: () => load(), onDeleted: () => router.replace('/admin/users'), notify: toast.show });

  if (error && !data) return <div className="adm-page"><Link className="adm-crumb" href="/admin/users"><ArrowLeft size={14} />All accounts</Link><div className="adm-notice">{error}</div></div>;
  if (!data) return <div className="adm-page"><div className="adm-skel" style={{ height: 120 }} /><div className="adm-skel" style={{ height: 320 }} /></div>;

  const { user: u } = data;
  const self = u.id === me?.id;
  const totalViews = data.events.reduce((s, e) => s + e.views, 0);

  return (
    <div className="adm-page">
      <div>
        <Link className="adm-crumb" href="/admin/users"><ArrowLeft size={14} />All accounts</Link>
        <div className="adm-head">
          <div className="adm-profile">
            <AdminAvatar name={u.name} src={u.avatarUrl} size="lg" />
            <div>
              <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{u.name}{u.artist?.isVerified && <VerifiedMark />}</h1>
              <div className="adm-profile-meta">
                <RoleBadge role={u.role} />
                <StatusBadge disabled={!!u.disabledAt} />
                <span className="adm-text-2" style={{ fontSize: 13.5 }}>{u.email}</span>
              </div>
            </div>
          </div>
          <div className="adm-head-actions">
            {u.artist && <Link className="adm-btn adm-btn-primary" href={`/admin/events/new?organizer=${u.artist.id}`}><CalendarPlus size={15} />Create event</Link>}
            <button type="button" className="adm-btn" onClick={() => actions.edit(u)}><PencilLine size={15} />Edit</button>
            <button type="button" className="adm-btn" onClick={() => actions.profile(u)}><ImageUp size={15} />{u.artist ? 'Public profile' : 'Photo'}</button>
            <button type="button" className="adm-btn" onClick={() => actions.reset(u)}><KeyRound size={15} />Reset password</button>
            {!self && <button type="button" className={`adm-btn${u.disabledAt ? '' : ' adm-btn-danger'}`} onClick={() => actions.toggleSuspend(u)}>{u.disabledAt ? <><CheckCircle2 size={15} />Reactivate</> : <><Ban size={15} />Suspend</>}</button>}
            {!self && <button type="button" className="adm-btn adm-btn-danger adm-icon-btn" aria-label="Delete account" title="Delete account" onClick={() => actions.remove(u)}><Trash2 size={15} /></button>}
          </div>
        </div>
      </div>

      {u.disabledAt && <div className="adm-notice"><Ban size={16} />Suspended {timeAgo(u.disabledAt)} ({dateTime(u.disabledAt)}). This account can’t sign in.</div>}

      <div className="adm-kpis">
        <StatTile label="Sign-ins" icon={<LogIn size={14} />} value={u.loginCount} accent="var(--series-3)" sub={`Last ${timeAgo(u.lastLoginAt).toLowerCase()}`} />
        <StatTile label="Failed sign-ins · 30 days" icon={<ShieldAlert size={14} />} value={data.failedLoginsLast30d} accent="var(--status-critical)" sub={data.failedLoginsLast30d ? 'Wrong password attempts' : 'No failed attempts'} />
        <StatTile label="Events" icon={<CalendarDays size={14} />} value={u.artist?._count.events ?? 0} accent="var(--series-1)" sub={u.artist ? `${u.artist._count.reels} reels` : 'Not an organizer'} />
        <StatTile label="Event views (all time)" icon={<Eye size={14} />} value={totalViews} accent="var(--series-1)" sub={u.artist ? `${full(u.artist.followerCount)} followers` : '—'} />
      </div>

      <div className="adm-grid">
        <div className="adm-col-5" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="adm-card">
            <div className="adm-card-head"><div><h3>Account</h3></div></div>
            <dl className="adm-dl">
              <dt>Email</dt><dd>{u.email}</dd>
              <dt>Phone</dt><dd>{u.phone || <span className="adm-muted">Not provided</span>}</dd>
              <dt>City</dt><dd>{u.city || <span className="adm-muted">—</span>}</dd>
              <dt>Joined</dt><dd>{dateTime(u.createdAt)}</dd>
              <dt>Created by</dt><dd>{data.createdBy ? <Link href={`/admin/users/${data.createdBy.id}`}>{data.createdBy.name}</Link> : 'Self sign-up'}</dd>
              <dt>Last sign-in</dt><dd>{u.lastLoginAt ? dateTime(u.lastLoginAt) : <span className="adm-muted">Never</span>}</dd>
              <dt>Saved / following</dt><dd>{full(u._count.tickets)} reservations · {full(u._count.follows)} follows</dd>
            </dl>
          </section>

          {u.artist && (
            <section className="adm-card">
              <div className="adm-card-head">
                <div><h3>Organizer profile</h3><p>@{u.artist.handle}{u.artist.category ? ` · ${u.artist.category}` : ''}</p></div>
                <Link className="adm-card-link" href={`/artists/${u.artist.id}`} target="_blank">Public page <ExternalLink size={13} /></Link>
              </div>
              <dl className="adm-dl">
                <dt>Followers</dt><dd>{full(u.artist.followerCount)}</dd>
                <dt>Verified</dt><dd>{u.artist.isVerified ? <span className="adm-badge adm-badge-good">Verified</span> : <span className="adm-badge">Not verified</span>}</dd>
                <dt>Approval</dt><dd>{u.artist.isPreferred ? 'Preferred — reels publish instantly' : 'Reels go through approval'}</dd>
                {u.artist.bio && <><dt>Bio</dt><dd className="adm-text-2">{u.artist.bio}</dd></>}
                <dt>Socials</dt><dd>{u.artist.socials && Object.values(u.artist.socials).some(Boolean)
                  ? <span style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{(['instagram', 'facebook', 'tiktok'] as const).filter((k) => u.artist?.socials?.[k]).map((k) => <a key={k} href={u.artist!.socials![k]} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{k.charAt(0).toUpperCase() + k.slice(1)}</a>)}</span>
                  : <span className="adm-muted">None yet: add them under Public profile</span>}</dd>
              </dl>
            </section>
          )}
        </div>

        <section className="adm-card adm-col-7">
          <div className="adm-card-head">
            <div><h3>Activity</h3><p>Sign-ins, changes and admin actions on this account</p></div>
            <Link className="adm-card-link" href={`/admin/activity?actorId=${u.id}`}>Full history</Link>
          </div>
          {data.activity.length === 0 ? <Empty title="No activity recorded yet" /> : (
            <div className="adm-feed">{data.activity.slice(0, 15).map((item) => <ActivityRow key={item.id} item={item} showActor={item.actorUserId !== u.id} showDevice currentId={u.id} />)}</div>
          )}
        </section>
      </div>

      {u.artist && (
        <section className="adm-card adm-card-flush">
          <div className="adm-card-head"><div><h3>Their events</h3><p>Newest first, with all-time views</p></div><Link className="adm-card-link" href={`/admin/events/new?organizer=${u.artist.id}`}><CalendarPlus size={13} />New event</Link></div>
          {data.events.length === 0 ? <Empty title="No events yet" /> : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead><tr><th>Event</th><th>Date</th><th>Status</th><th className="adm-right">Views</th><th className="adm-right">People</th><th></th></tr></thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <div className="adm-cell-user" style={{ minWidth: 260 }}>
                          {e.flyerUrl ? <img className="adm-thumb" src={mediaUrl(e.flyerUrl) || e.flyerUrl} alt="" /> : <span className="adm-thumb-ph"><CalendarDays size={16} /></span>}
                          <span className="adm-cell-copy"><strong>{e.title}</strong><span>{[e.venueName, e.cityName].filter(Boolean).join(' · ')}</span></span>
                        </div>
                      </td>
                      <td className="adm-text-2 adm-nowrap">{shortDate(e.startsAt)}</td>
                      <td><EventStatusBadge status={e.status} /></td>
                      <td className="adm-right">{full(e.views)}</td>
                      <td className="adm-right">{full(e.visitors)}</td>
                      <td><div className="adm-row-actions"><Link className="adm-btn adm-btn-sm" href={`/events/${e.id}`} target="_blank">View</Link><Link className="adm-btn adm-btn-sm" href={`/admin/events/${e.id}/edit`}>Edit</Link></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
      {actions.node}
      {toast.node}
    </div>
  );
}
