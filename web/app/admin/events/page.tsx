'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, ExternalLink, Link2, PencilLine, Search, Trash2 } from 'lucide-react';
import { type AdminEvent, type EventList, adminApi, full, shortDate } from '@/lib/admin';
import { mediaUrl } from '@/lib/format';
import { ConfirmDialog, Empty, Pager, useToast } from '@/components/admin/ui';

const TAKE = 25;
const STATUSES = ['published', 'live', 'draft', 'cancelled', 'ended'];
const WHEN = [
  { value: 'all', label: 'All events' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function AdminEventsPage() {
  const toast = useToast();
  const [when, setWhen] = useState('upcoming');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [data, setData] = useState<EventList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'delete' | 'status'; event: AdminEvent; status?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setSkip(0); }, [when, status, query]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminApi.events({ q: query, status, when, take: TAKE, skip })); setError(''); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [query, status, when, skip]);
  useEffect(() => { load(); }, [load]);

  async function apply() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'delete') {
        await adminApi.deleteEvent(confirm.event.id);
        toast.show(`“${confirm.event.title}” deleted`);
      } else if (confirm.status) {
        await adminApi.setEventStatus(confirm.event.id, confirm.status);
        toast.show(`“${confirm.event.title}” is now ${confirm.status}`);
      }
      setConfirm(null);
      load();
    } catch (err) { toast.show((err as Error).message, true); }
    finally { setBusy(false); }
  }

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">Content</div>
          <h1>Events</h1>
          <p>Every event on Stage with its traffic. Change visibility, edit, or take an event down.</p>
        </div>
      </div>

      <div className="adm-chips" role="group" aria-label="Status counts">
        {STATUSES.map((s) => (
          <button key={s} type="button" className="adm-chip" aria-pressed={status === s} onClick={() => setStatus(status === s ? '' : s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}<em>{data ? full(data.counts[s] || 0) : '–'}</em>
          </button>
        ))}
      </div>

      <section className="adm-card adm-card-flush">
        <div className="adm-toolbar" style={{ padding: 16, borderBottom: '1px solid var(--adm-line)' }}>
          <div className="adm-search"><Search size={16} /><input className="adm-input" placeholder="Search title, venue, city or organizer" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" /></div>
          <div className="adm-seg-control" role="group" aria-label="When">
            {WHEN.map((w) => <button key={w.value} type="button" aria-pressed={when === w.value} onClick={() => setWhen(w.value)}>{w.label}</button>)}
          </div>
        </div>
        {error && <div style={{ padding: 16 }}><div className="adm-notice">{error}</div></div>}
        <div className="adm-table-wrap" style={{ opacity: loading && data ? 0.55 : 1, transition: 'opacity .2s ease' }}>
          <table className="adm-table">
            <thead>
              <tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th className="adm-right">Views</th><th className="adm-right">Saves</th><th>Tickets</th><th className="adm-right">Actions</th></tr>
            </thead>
            <tbody>
              {!data && loading && Array.from({ length: 6 }, (_, i) => <tr key={i}><td colSpan={8}><div className="adm-skel" style={{ height: 38 }} /></td></tr>)}
              {data?.items.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className="adm-cell-user" style={{ minWidth: 230 }}>
                      {e.flyerUrl ? <img className="adm-thumb" src={mediaUrl(e.flyerUrl) || e.flyerUrl} alt="" /> : <span className="adm-thumb-ph"><CalendarDays size={16} /></span>}
                      <span className="adm-cell-copy"><strong title={e.title}>{e.title}</strong><span>{[e.venueName, e.cityName].filter(Boolean).join(' · ') || '—'}</span></span>
                    </div>
                  </td>
                  <td>{e.organizer ? <span className="adm-cell-copy"><strong>{e.organizer.name}</strong><span>@{e.organizer.handle}</span></span> : <span className="adm-muted">—</span>}</td>
                  <td className="adm-text-2 adm-nowrap">{shortDate(e.startsAt)}</td>
                  <td>
                    <select className={`adm-select adm-status-select is-${e.status}`} value={e.status} aria-label={`Status of ${e.title}`} onChange={(ev) => setConfirm({ kind: 'status', event: e, status: ev.target.value })}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="adm-right"><span className="adm-cell-copy" style={{ alignItems: 'flex-end' }}><strong className="adm-num">{full(e.views)}</strong><span>{full(e.visitors)} people</span></span></td>
                  <td className="adm-right">{full(e.saves)}</td>
                  <td>{e.hasTicketLink ? <span className="adm-badge adm-badge-good"><Link2 size={12} />Linked</span> : <span className="adm-muted" style={{ fontSize: 12.5 }}>No link</span>}</td>
                  <td>
                    <div className="adm-row-actions">
                      <Link className="adm-btn adm-btn-ghost adm-icon-btn" href={`/events/${e.id}`} target="_blank" title="View on the website" aria-label={`View ${e.title}`}><ExternalLink size={15} /></Link>
                      <Link className="adm-btn adm-btn-ghost adm-icon-btn" href={`/studio/events/${e.id}/edit`} title="Edit in the studio" aria-label={`Edit ${e.title}`}><PencilLine size={15} /></Link>
                      <button type="button" className="adm-btn adm-btn-ghost adm-icon-btn" title="Delete" aria-label={`Delete ${e.title}`} onClick={() => setConfirm({ kind: 'delete', event: e })}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && data.items.length === 0 && <Empty icon={<CalendarDays />} title="No events match" copy="Try another filter or search." />}
        {data && <Pager skip={skip} take={TAKE} total={data.total} onPage={setSkip} />}
      </section>

      {confirm?.kind === 'delete' && (
        <ConfirmDialog title={`Delete “${confirm.event.title}”?`} danger busy={busy} confirmLabel="Delete event" onClose={() => setConfirm(null)} onConfirm={apply}
          body={<>The event, its flyers and its saves are removed from the website and the app for everyone. This can’t be undone — setting it to <strong>cancelled</strong> or <strong>draft</strong> hides it reversibly.</>} />
      )}
      {confirm?.kind === 'status' && (
        <ConfirmDialog title={`Set “${confirm.event.title}” to ${confirm.status}?`} busy={busy} confirmLabel="Change status" danger={confirm.status === 'cancelled'} onClose={() => setConfirm(null)} onConfirm={apply}
          body={confirm.status === 'draft' ? 'Drafts are hidden from guests until published again.' : confirm.status === 'cancelled' ? 'Guests will see the event as cancelled.' : `The event will show as ${confirm.status}.`} />
      )}
      {toast.node}
    </div>
  );
}
