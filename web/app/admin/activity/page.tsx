'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, History, Search, X } from 'lucide-react';
import { ACTIVITY_CATEGORIES, type ActivityItem, type ActivityList, actionLabel, adminApi, deviceLabel, full } from '@/lib/admin';
import { ActivityRow, Empty, Pager, Segmented, useToast } from '@/components/admin/ui';

const TAKE = 40;
type Range = 'today' | '7d' | '30d' | '90d' | 'all';

function dayHeading(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function csvCell(value: unknown) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function AdminActivityPage() {
  const toast = useToast();
  const [range, setRange] = useState<Range>('30d');
  const [category, setCategory] = useState('');
  const [actorId, setActorId] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [skip, setSkip] = useState(0);
  const [data, setData] = useState<ActivityList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Deep links: ?category=auth, ?actorId=<user>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('category');
    if (c && ACTIVITY_CATEGORIES.some((x) => x.key === c)) setCategory(c);
    const a = params.get('actorId');
    if (a) { setActorId(a); setRange('all'); }
    setHydrated(true);
  }, []);

  useEffect(() => { const t = setTimeout(() => setQuery(q.trim()), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setSkip(0); }, [range, category, actorId, query]);

  const params = useMemo(() => ({ range, category: category || undefined, actorId: actorId || undefined, q: query || undefined }), [range, category, actorId, query]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await adminApi.activity({ ...params, take: TAKE, skip })); setError(''); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }, [params, skip]);
  useEffect(() => { if (hydrated) load(); }, [load, hydrated]);

  const categoryCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [action, count] of Object.entries(data?.facets || {})) {
      const key = action.split('.')[0];
      out[key] = (out[key] || 0) + count;
    }
    return out;
  }, [data]);
  const allCount = Object.values(categoryCounts).reduce((s, n) => s + n, 0);

  const groups = useMemo(() => {
    const out: Array<{ day: string; items: ActivityItem[] }> = [];
    for (const item of data?.items || []) {
      const day = dayHeading(item.createdAt);
      if (out[out.length - 1]?.day !== day) out.push({ day, items: [] });
      out[out.length - 1].items.push(item);
    }
    return out;
  }, [data]);

  const actorName = actorId ? data?.items.find((i) => i.actorUserId === actorId)?.actor?.name || 'this account' : '';

  async function exportCsv() {
    setExporting(true);
    try {
      const rows: ActivityItem[] = [];
      for (let page = 0; page < 50; page++) {
        const res = await adminApi.activity({ ...params, take: 100, skip: page * 100 });
        rows.push(...res.items);
        if (rows.length >= res.total || res.items.length === 0) break;
      }
      const header = ['Time', 'Action', 'Summary', 'Actor', 'Actor email', 'Role', 'Source', 'Device', 'IP', 'Target type', 'Target id'];
      const lines = rows.map((r) => [
        new Date(r.createdAt).toISOString(), actionLabel(r.action), r.summary, r.actor?.name, r.actor?.email || r.actorEmail, r.actorRole,
        r.source, deviceLabel(r.userAgent), r.ip, r.targetType, r.targetId,
      ].map(csvCell).join(','));
      const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stage-activity-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.show(`Exported ${rows.length.toLocaleString('en')} rows`);
    } catch (err) { toast.show((err as Error).message, true); }
    finally { setExporting(false); }
  }

  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <div className="adm-eyebrow">Audit trail</div>
          <h1>Activity log</h1>
          <p>Every sign-in, sign-up, event change, follow, reservation and admin action — with who, when, where from and on which device.</p>
        </div>
        <div className="adm-head-actions">
          <Segmented<Range> label="Date range" value={range} onChange={setRange} options={[
            { value: 'today', label: 'Today' }, { value: '7d', label: '7 days' }, { value: '30d', label: '30 days' }, { value: '90d', label: '90 days' }, { value: 'all', label: 'All' },
          ]} />
          <button type="button" className="adm-btn" onClick={exportCsv} disabled={exporting || !data?.total}><Download size={15} />{exporting ? 'Exporting…' : 'Export CSV'}</button>
        </div>
      </div>

      <div className="adm-chips" role="group" aria-label="Filter by type">
        <button type="button" className="adm-chip" aria-pressed={!category} onClick={() => setCategory('')}>Everything<em>{data ? full(allCount) : '–'}</em></button>
        {ACTIVITY_CATEGORIES.map((c) => (
          <button key={c.key} type="button" className="adm-chip" aria-pressed={category === c.key} onClick={() => setCategory(category === c.key ? '' : c.key)}>
            {c.label}<em>{data ? full(categoryCounts[c.key] || 0) : '–'}</em>
          </button>
        ))}
      </div>

      <section className="adm-card adm-card-flush">
        <div className="adm-toolbar" style={{ padding: 16, borderBottom: '1px solid var(--adm-line)' }}>
          <div className="adm-search"><Search size={16} /><input className="adm-input" placeholder="Search description, email or IP address" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search activity" /></div>
          {actorId && <button type="button" className="adm-chip" aria-pressed onClick={() => setActorId('')}>Only {actorName}<X size={13} /></button>}
          <span className="adm-muted" style={{ marginLeft: 'auto', fontSize: 12.5 }}>{data ? `${full(data.total)} entries` : ''}</span>
        </div>
        {error && <div style={{ padding: 16 }}><div className="adm-notice">{error}</div></div>}
        <div style={{ padding: '6px 20px 10px', opacity: loading && data ? 0.55 : 1, transition: 'opacity .2s ease' }}>
          {!data && loading && Array.from({ length: 8 }, (_, i) => <div key={i} className="adm-skel" style={{ height: 44, margin: '12px 0' }} />)}
          {data && data.items.length === 0 && <Empty icon={<History />} title="No activity in this view" copy="Widen the date range or clear a filter." />}
          {groups.map((g) => (
            <div key={g.day}>
              <div className="adm-nav-label" style={{ padding: '16px 0 4px' }}>{g.day}</div>
              <div className="adm-feed">{g.items.map((item) => <ActivityRow key={item.id} item={item} showDevice />)}</div>
            </div>
          ))}
        </div>
        {data && <Pager skip={skip} take={TAKE} total={data.total} onPage={(s) => { setSkip(s); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
      </section>
      {toast.node}
    </div>
  );
}
