'use client';

import { useEffect, useRef, useState } from 'react';
import { Ban, Check, LoaderCircle, Plus, Search, X } from 'lucide-react';
import { type OrganizerOption, adminApi, full } from '@/lib/admin';
import { AdminAvatar, VerifiedMark } from './ui';
import { UserFormModal } from './user-actions';

/**
 * "Publish this event as…" — search any organizer, or create a new organizer
 * account on the spot and select it. Used by the console's event editor.
 */
export function OrganizerPicker({ value, onChange }: { value: OrganizerOption | null; onChange: (o: OrganizerOption | null) => void }) {
  const [open, setOpen] = useState(!value);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<OrganizerOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // A value that arrives after mount (preselected organizer) closes the search.
  useEffect(() => { if (value) setOpen(false); }, [value?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      adminApi.organizers({ q: q.trim() || undefined, take: 8 })
        .then((rows) => { if (!cancelled) { setResults(rows); setError(''); } })
        .catch((err: Error) => { if (!cancelled) setError(err.message); })
        .finally(() => { if (!cancelled) setLoading(false); });
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q, open]);

  // Close the list on an outside click once something is selected.
  useEffect(() => {
    if (!open || !value) return;
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, value]);

  function pick(o: OrganizerOption) {
    onChange(o);
    setOpen(false);
    setQ('');
  }

  return (
    <div className="adm-org" ref={boxRef}>
      <label htmlFor="org-search">Organizer <em>Required</em></label>
      {value && !open ? (
        <div className="adm-org-selected">
          <AdminAvatar name={value.name} src={value.avatarUrl} />
          <div className="adm-org-copy">
            <strong>{value.name}{value.isVerified && <VerifiedMark />}</strong>
            <span>@{value.handle} · {full(value.events)} events · {full(value.followerCount)} followers</span>
          </div>
          {value.suspended && <span className="adm-badge adm-badge-critical"><Ban size={12} />Suspended</span>}
          <button type="button" className="button button-ghost" onClick={() => setOpen(true)}>Change</button>
        </div>
      ) : (
        <div className="adm-org-search">
          <div className="search-box">
            <Search size={17} />
            <input id="org-search" className="input" autoComplete="off" placeholder="Search organizers by name, @handle or email" value={q} onChange={(e) => setQ(e.target.value)} autoFocus={!!value} />
            {value && <button type="button" className="adm-org-close" onClick={() => setOpen(false)} aria-label="Keep current organizer"><X size={16} /></button>}
          </div>
          <div className="adm-org-list" role="listbox" aria-label="Organizers">
            {loading && !results && <div className="adm-org-note"><LoaderCircle size={15} className="adm-spin" />Loading organizers…</div>}
            {error && <div className="adm-org-note">{error}</div>}
            {results?.map((o) => (
              <button type="button" role="option" aria-selected={value?.id === o.id} key={o.id} className="adm-org-row" onClick={() => pick(o)}>
                <AdminAvatar name={o.name} src={o.avatarUrl} size="sm" />
                <span className="adm-org-copy">
                  <strong>{o.name}{o.isVerified && <VerifiedMark />}</strong>
                  <span>@{o.handle}{o.category ? ` · ${o.category}` : ''} · {full(o.events)} events{o.suspended ? ' · suspended' : ''}</span>
                </span>
                {value?.id === o.id && <Check size={16} />}
              </button>
            ))}
            {results && results.length === 0 && <div className="adm-org-note">No organizer matches “{q}”.</div>}
            <button type="button" className="adm-org-row adm-org-new" onClick={() => setCreating(true)}>
              <span className="adm-org-plus"><Plus size={16} /></span>
              <span className="adm-org-copy"><strong>Create a new organizer</strong><span>Makes their account and profile, then selects it here</span></span>
            </button>
          </div>
        </div>
      )}
      {creating && (
        <UserFormModal
          initialRole="artist"
          initialName={q.trim()}
          onClose={() => setCreating(false)}
          onSaved={(u) => {
            setCreating(false);
            if (u.artist) {
              pick({
                id: u.artist.id, userId: u.id, handle: u.artist.handle, name: u.name, avatarUrl: u.avatarUrl,
                category: u.artist.category, isVerified: u.artist.isVerified, suspended: false, followerCount: 0, events: 0,
              });
            }
          }}
        />
      )}
    </div>
  );
}
