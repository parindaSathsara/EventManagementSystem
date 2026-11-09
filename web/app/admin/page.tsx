'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AppWindow, ArrowRight, CalendarCheck2, CalendarPlus, Eye, Globe, LogIn, MousePointerClick, RefreshCw, ShieldAlert,
  Smartphone, UserPlus, UserRoundSearch, UsersRound,
} from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { type Overview, type Range, RANGE_LABEL, adminApi, bucketLabel, compact, deviceLabel, full, timeAgo, dateTime } from '@/lib/admin';
import { ChartTableToggle, ColumnChart, Legend, SeriesTable, SplitBar, TrendChart } from '@/components/admin/charts';
import { ActivityRow, AdminAvatar, Delta, Empty, Segmented, StatTile, VerifiedMark } from '@/components/admin/ui';
import { mediaUrl } from '@/lib/format';

const C = { views: 'var(--series-1)', visitors: 'var(--series-2)', logins: 'var(--series-3)', signups: 'var(--series-4)' };
const REFRESH_MS = 60_000;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>('7d');
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trafficTable, setTrafficTable] = useState(false);
  const [loginTable, setLoginTable] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      setData(await adminApi.overview(range));
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { load(); }, [load]);
  // A monitoring screen: keep it fresh while it's open.
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') load(true); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [load]);

  const axis = useMemo(() => {
    if (!data) return { short: [], long: [] };
    const hourly = data.window.hourly;
    return {
      short: data.series.map((p) => bucketLabel(p.bucket, hourly)),
      long: data.series.map((p) => bucketLabel(p.bucket, hourly, true)),
    };
  }, [data]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const stale = loading && !!data;

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">Super admin console</div>
          <h1>{greeting()}, {firstName}</h1>
          <p>Here’s what’s happening across the Stage website and app · {RANGE_LABEL[range].toLowerCase()}.</p>
        </div>
        <div className="adm-head-actions">
          {data && <span className="adm-live" title="Unique visitors in the last 5 minutes"><i className="adm-live-dot" /><strong>{full(data.live.visitors)}</strong> online now</span>}
          <Segmented<Range> label="Date range" value={range} onChange={setRange} options={[
            { value: 'today', label: 'Today' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' },
          ]} />
          <button type="button" className="adm-btn adm-icon-btn" onClick={() => load()} aria-label="Refresh" title={data ? `Updated ${timeAgo(data.generatedAt)}` : 'Refresh'}>
            <RefreshCw size={15} className={loading ? 'adm-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="adm-notice" role="alert">Couldn’t load the dashboard: {error}</div>}

      {!data ? <DashboardSkeleton /> : (
        <>
          {/* Traffic — the one hero number */}
          <div className="adm-grid">
            <section className="adm-card adm-col-8">
              <div className="adm-hero-row">
                <div>
                  <div className="adm-hero-label"><UsersRound size={15} />Unique visitors</div>
                  <div className="adm-hero-value">{full(data.current.visitors)}</div>
                  <div className="adm-hero-meta">
                    <Delta current={data.current.visitors} previous={data.previous.visitors} suffix={range === 'today' ? 'vs yesterday' : 'vs previous period'} />
                    <span>·</span>
                    <span>{full(data.series.reduce((s, p) => s + p.views, 0))} views this period</span>
                    <span>·</span>
                    <span>{compact(data.totals.allTime.visitors)} visitors all-time</span>
                  </div>
                </div>
                <ChartTableToggle showTable={trafficTable} onChange={setTrafficTable} />
              </div>
              {(() => {
                const series = [
                  { key: 'views', label: 'Views', color: C.views, values: data.series.map((p) => p.views), area: true },
                  { key: 'visitors', label: 'Unique visitors', color: C.visitors, values: data.series.map((p) => p.visitors) },
                ];
                return trafficTable
                  ? <SeriesTable labels={axis.long} series={series} height={280} />
                  : <TrendChart series={series} labels={axis.short} longLabels={axis.long} height={280} stale={stale} ariaLabel="Views and unique visitors over time" />;
              })()}
              <div className="adm-chart-foot">
                <Legend items={[{ label: 'Views (pages, events, profiles, app opens)', color: C.views }, { label: 'Unique visitors', color: C.visitors }]} />
                <span className="adm-muted" style={{ fontSize: 12 }}>{data.window.hourly ? 'Hourly, Sri Lanka time' : 'Daily, Sri Lanka time'}</span>
              </div>
            </section>

            <section className="adm-card adm-col-4">
              <div className="adm-card-head"><div><h3>Website vs app</h3><p>Share of views this period</p></div></div>
              <SplitBar unit="views" parts={data.sources.map((s) => ({
                label: s.source === 'web' ? 'Website' : 'Mobile app',
                value: s.views,
                color: s.source === 'web' ? C.views : C.visitors,
                sub: `${full(s.visitors)} visitors`,
              }))} />
              <div style={{ height: 22 }} />
              <div className="adm-card-head" style={{ marginBottom: 12 }}><div><h3>Mobile app installs</h3><p>Devices registered with the Stage app</p></div></div>
              <div className="adm-snapshot">
                <div className="adm-snap"><span><Smartphone size={13} />Installs</span><strong>{compact(data.totals.devices.total)}</strong></div>
                <div className="adm-snap"><span><AppWindow size={13} />Active this week</span><strong>{compact(data.totals.devices.activeWeek)}</strong></div>
                <div className="adm-snap"><span>Push alerts on</span><strong>{compact(data.totals.devices.pushReady)}</strong></div>
                <div className="adm-snap"><span>App opens</span><strong>{compact(data.current.appOpens)}</strong></div>
              </div>
            </section>
          </div>

          {/* KPI tiles */}
          <div className="adm-kpis">
            <StatTile label="Event views" icon={<Eye size={14} />} value={data.current.eventViews} previous={data.previous.eventViews} trend={data.series.map((p) => p.eventViews)} accent={C.views} />
            <StatTile label="Website page views" icon={<Globe size={14} />} value={data.current.pageViews} previous={data.previous.pageViews} trend={data.series.map((p) => p.webViews)} accent={C.views} />
            <StatTile label="Organizer profile views" icon={<UserRoundSearch size={14} />} value={data.current.profileViews} previous={data.previous.profileViews} accent={C.visitors} />
            <StatTile label="App opens" icon={<Smartphone size={14} />} value={data.current.appOpens} previous={data.previous.appOpens} trend={data.series.map((p) => p.appViews)} accent={C.visitors} />
            <StatTile label="Sign-ins" icon={<LogIn size={14} />} value={data.current.logins} previous={data.previous.logins} trend={data.series.map((p) => p.logins)} accent={C.logins} />
            <StatTile label="Failed sign-ins" icon={<ShieldAlert size={14} />} value={data.current.failedLogins} previous={data.previous.failedLogins} trend={data.series.map((p) => p.failedLogins)} accent="var(--status-critical)" upIsGood={false} />
            <StatTile label="New accounts" icon={<UserPlus size={14} />} value={data.current.newAccounts} previous={data.previous.newAccounts} trend={data.series.map((p) => p.signups)} accent={C.signups} />
            <StatTile label="Events created" icon={<CalendarPlus size={14} />} value={data.current.eventsCreated} previous={data.previous.eventsCreated} accent={C.views} />
          </div>

          {/* Sign-ins */}
          <div className="adm-grid">
            <section className="adm-card adm-col-7">
              <div className="adm-card-head">
                <div><h3>Sign-ins & sign-ups</h3><p>{full(data.current.activeUsers)} different people signed in · {full(data.current.failedLogins)} failed attempts</p></div>
                <ChartTableToggle showTable={loginTable} onChange={setLoginTable} />
              </div>
              {(() => {
                const series = [
                  { key: 'logins', label: 'Sign-ins', color: C.logins, values: data.series.map((p) => p.logins) },
                  { key: 'signups', label: 'Sign-ups', color: C.signups, values: data.series.map((p) => p.signups) },
                ];
                return loginTable
                  ? <SeriesTable labels={axis.long} series={[...series, { key: 'failed', label: 'Failed sign-ins', color: '', values: data.series.map((p) => p.failedLogins) }]} height={230} />
                  : <ColumnChart series={series} labels={axis.short} longLabels={axis.long} height={230} stale={stale} ariaLabel="Sign-ins and sign-ups over time" />;
              })()}
              <div className="adm-chart-foot"><Legend kind="rect" items={[{ label: 'Sign-ins', color: C.logins }, { label: 'Sign-ups', color: C.signups }]} /></div>
            </section>

            <section className="adm-card adm-col-5">
              <div className="adm-card-head">
                <div><h3>Sign-in monitor</h3><p>Latest sign-ins and failed attempts</p></div>
                <Link className="adm-card-link" href="/admin/activity?category=auth">All <ArrowRight size={13} /></Link>
              </div>
              {data.recentLogins.length === 0 ? <Empty title="No sign-ins yet" /> : (
                <div className="adm-feed">
                  {data.recentLogins.map((item) => {
                    const failed = item.action === 'auth.login_failed';
                    const device = deviceLabel(item.userAgent);
                    return (
                      <div className="adm-feed-item" key={item.id}>
                        {item.actor ? <AdminAvatar name={item.actor.name} src={item.actor.avatarUrl} size="sm" /> : <span className="adm-feed-icon is-critical"><ShieldAlert size={15} /></span>}
                        <div className="adm-feed-copy">
                          <strong>{item.actor ? <Link href={`/admin/users/${item.actor.id}`}>{item.actor.name}</Link> : item.actorEmail || 'Unknown email'}</strong>
                          <div className="adm-feed-meta">
                            {failed ? <span className="adm-badge adm-badge-critical" style={{ minHeight: 20 }}>Failed</span> : <span className="adm-badge adm-badge-good" style={{ minHeight: 20 }}>Signed in</span>}
                            {device && <span>{device}</span>}
                            {item.ip && <span>{item.ip}</span>}
                          </div>
                        </div>
                        <time className="adm-feed-time" dateTime={item.createdAt} title={dateTime(item.createdAt)}>{timeAgo(item.createdAt)}</time>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* Leaderboards */}
          <div className="adm-grid">
            <section className="adm-card adm-col-7">
              <div className="adm-card-head">
                <div><h3>Most viewed events</h3><p>Event pages opened on the website and in the app</p></div>
                <Link className="adm-card-link" href="/admin/events">All events <ArrowRight size={13} /></Link>
              </div>
              {data.topEvents.length === 0 ? <Empty title="No event views yet" copy="Views appear here as soon as people open event pages." /> : (
                <div className="adm-rank">
                  {data.topEvents.map((e, i) => (
                    <div className="adm-rank-row" key={e.id}>
                      <span className="adm-rank-pos">{i + 1}</span>
                      <div className="adm-rank-main">
                        <div className="adm-rank-title">
                          {e.flyerUrl ? <img className="adm-thumb" src={mediaUrl(e.flyerUrl) || e.flyerUrl} alt="" /> : <span className="adm-thumb-ph"><CalendarCheck2 size={16} /></span>}
                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Link href={`/events/${e.id}`} target="_blank">{e.title}</Link>
                            <span className="adm-rank-sub">{e.organizer?.name || 'Unknown organizer'} · {new Date(e.startsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {e.cityName}</span>
                          </div>
                        </div>
                        <div className="adm-meter"><i style={{ width: `${(e.views / data.topEvents[0].views) * 100}%`, background: C.views }} /></div>
                      </div>
                      <div className="adm-rank-value"><strong>{full(e.views)}</strong><span>{full(e.visitors)} people · {full(e.appViews)} in app</span></div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="adm-card adm-col-5">
              <div className="adm-card-head">
                <div><h3>Top organizers by reach</h3><p>Event views + profile views</p></div>
                <Link className="adm-card-link" href="/admin/users?role=artist">Organizers <ArrowRight size={13} /></Link>
              </div>
              {data.topOrganizers.length === 0 ? <Empty title="No organizer traffic yet" /> : (
                <div className="adm-rank">
                  {data.topOrganizers.map((o, i) => (
                    <div className="adm-rank-row" key={o.id}>
                      <span className="adm-rank-pos">{i + 1}</span>
                      <div className="adm-rank-main">
                        <div className="adm-rank-title">
                          <AdminAvatar name={o.name} src={o.avatarUrl} size="sm" />
                          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Link href={`/admin/users/${o.userId}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{o.name}{o.isVerified && <VerifiedMark />}</Link>
                            <span className="adm-rank-sub">@{o.handle} · {full(o.followerCount)} followers · {o.events} events</span>
                          </div>
                        </div>
                        <div className="adm-meter"><i style={{ width: `${(o.total / data.topOrganizers[0].total) * 100}%`, background: C.visitors }} /></div>
                      </div>
                      <div className="adm-rank-value"><strong>{full(o.total)}</strong><span>{full(o.eventViews)} event · {full(o.profileViews)} profile</span></div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Activity + platform */}
          <div className="adm-grid">
            <section className="adm-card adm-col-7">
              <div className="adm-card-head">
                <div><h3>Live activity</h3><p>Everything people and admins did, newest first</p></div>
                <Link className="adm-card-link" href="/admin/activity">Activity log <ArrowRight size={13} /></Link>
              </div>
              {data.recentActivity.length === 0 ? <Empty title="Nothing yet" copy="Sign-ins, edits and admin actions will stream in here." /> : (
                <div className="adm-feed">{data.recentActivity.map((item) => <ActivityRow key={item.id} item={item} />)}</div>
              )}
            </section>

            <div className="adm-col-5" style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              <section className="adm-card">
                <div className="adm-card-head"><div><h3>Platform at a glance</h3><p>Totals right now</p></div></div>
                <div className="adm-snapshot">
                  <div className="adm-snap"><span>Accounts</span><strong>{compact(data.totals.users.total)}</strong><em>{full(data.totals.users.disabled)} suspended</em></div>
                  <div className="adm-snap"><span>Organizers</span><strong>{compact(data.totals.organizers.total)}</strong><em>{full(data.totals.organizers.verified)} verified</em></div>
                  <div className="adm-snap"><span>Upcoming events</span><strong>{compact(data.totals.events.upcoming)}</strong><em>{full(data.totals.events.total)} total</em></div>
                  <div className="adm-snap"><span>Follows</span><strong>{compact(data.totals.followers.total)}</strong><em>{full(data.totals.followers.guests)} from guests</em></div>
                  <div className="adm-snap"><span>Super admins</span><strong>{compact(data.totals.users.admins)}</strong><em>{full(data.totals.users.customers)} guest accounts</em></div>
                  <div className="adm-snap"><span>Views all-time</span><strong>{compact(data.totals.allTime.views)}</strong><em>since tracking began</em></div>
                </div>
              </section>

              <section className="adm-card">
                <div className="adm-card-head"><div><h3>Top website pages</h3><p>Most opened pages this period</p></div></div>
                {data.topPages.length === 0 ? <Empty title="No page views yet" icon={<MousePointerClick />} /> : (
                  <div className="adm-rank">
                    {data.topPages.map((p, i) => (
                      <div className="adm-rank-row" key={p.path}>
                        <span className="adm-rank-pos">{i + 1}</span>
                        <div className="adm-rank-main">
                          <div className="adm-rank-title" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                            <Link href={p.path} target="_blank">{p.label || p.path}</Link>
                            {p.label && <span className="adm-rank-sub">{p.path}</span>}
                          </div>
                          <div className="adm-meter"><i style={{ width: `${(p.views / data.topPages[0].views) * 100}%`, background: C.views }} /></div>
                        </div>
                        <div className="adm-rank-value"><strong>{full(p.views)}</strong><span>{full(p.visitors)} visitors</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <div className="adm-grid">
        <div className="adm-card adm-col-8"><div className="adm-skel" style={{ height: 360 }} /></div>
        <div className="adm-card adm-col-4"><div className="adm-skel" style={{ height: 360 }} /></div>
      </div>
      <div className="adm-kpis">{Array.from({ length: 8 }, (_, i) => <div key={i} className="adm-stat"><div className="adm-skel" style={{ height: 86 }} /></div>)}</div>
    </>
  );
}
