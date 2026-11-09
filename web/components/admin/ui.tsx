'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, BadgeCheck, Ban, CalendarDays, CheckCircle2, Crown, Heart, Inbox,
  KeyRound, LogIn, Minus, PencilLine, ShieldAlert, Ticket, Trash2, UserPlus, UserRound, X,
} from 'lucide-react';
import { mediaUrl } from '@/lib/format';
import {
  type ActivityItem, type Role, ROLE_LABEL, actionLabel, actionTone, compact, delta as computeDelta, deviceLabel, timeAgo, dateTime,
} from '@/lib/admin';
import { Sparkline } from './charts';

// --- avatar -----------------------------------------------------------------------

export function AdminAvatar({ name, src, size = 'md' }: { name?: string | null; src?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
  const resolved = src ? mediaUrl(src) || src : null;
  return (
    <span className={`adm-avatar${size === 'sm' ? ' adm-avatar-sm' : size === 'lg' ? ' adm-avatar-lg' : ''}`} aria-hidden>
      {resolved && !failed ? <img src={resolved} alt="" onError={() => setFailed(true)} /> : initials}
    </span>
  );
}

// --- badges -----------------------------------------------------------------------

export function RoleBadge({ role }: { role: Role }) {
  const icon = role === 'admin' ? <Crown size={12} /> : role === 'artist' ? <CalendarDays size={12} /> : <UserRound size={12} />;
  return <span className={`adm-badge${role === 'admin' ? ' adm-badge-admin' : role === 'artist' ? ' adm-badge-artist' : ''}`}>{icon}{ROLE_LABEL[role]}</span>;
}

export function StatusBadge({ disabled }: { disabled: boolean }) {
  return disabled
    ? <span className="adm-badge adm-badge-critical"><Ban size={12} />Suspended</span>
    : <span className="adm-badge adm-badge-good"><CheckCircle2 size={12} />Active</span>;
}

export function EventStatusBadge({ status }: { status: string }) {
  const tone = status === 'published' || status === 'live' ? 'adm-badge-good' : status === 'cancelled' ? 'adm-badge-critical' : status === 'draft' ? 'adm-badge-warning' : '';
  return <span className={`adm-badge ${tone}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

export function VerifiedMark() {
  return <BadgeCheck size={15} color="#69a7ff" aria-label="Verified" />;
}

// --- stat tile ---------------------------------------------------------------------

/**
 * label · value · delta vs the previous period · 12+ point sparkline.
 * `upIsGood=false` flips the delta color (e.g. failed sign-ins).
 */
export function StatTile({ label, icon, value, previous, trend, accent, upIsGood = true, sub }: {
  label: string;
  icon: React.ReactNode;
  value: number;
  previous?: number;
  trend?: number[];
  accent: string;
  upIsGood?: boolean;
  sub?: string;
}) {
  return (
    <div className="adm-stat">
      <div className="adm-stat-label">{icon}{label}</div>
      <div className="adm-stat-value" title={value.toLocaleString('en')}>{compact(value)}</div>
      <div className="adm-stat-foot">
        {previous !== undefined ? <Delta current={value} previous={previous} upIsGood={upIsGood} /> : <span className="adm-stat-sub">{sub}</span>}
        {trend && trend.length > 1 && <Sparkline values={trend} accent={accent} />}
      </div>
    </div>
  );
}

export function Delta({ current, previous, upIsGood = true, suffix = 'vs prev.' }: { current: number; previous: number; upIsGood?: boolean; suffix?: string }) {
  const { pct, diff } = computeDelta(current, previous);
  if (diff === 0) return <span className="adm-delta is-flat"><Minus size={13} />No change <span>{suffix}</span></span>;
  const up = diff > 0;
  const good = up === upIsGood;
  return (
    <span className={`adm-delta ${good ? 'is-good' : 'is-bad'}`}>
      {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {pct === null ? `+${compact(diff)}` : `${up ? '+' : ''}${pct}%`}
      <span>{suffix}</span>
    </span>
  );
}

// --- segmented control -------------------------------------------------------------

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="adm-seg-control" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

// --- modal + confirm ------------------------------------------------------------------

export function Modal({ title, subtitle, onClose, children, footer, size }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])');
    first?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  // Portal: dialogs open from inside other forms (the event editor), and a
  // <form> nested in a <form> is invalid HTML. Into the console root, not
  // <body>, so the dialog keeps the console's colour tokens.
  return createPortal(
    <div className="adm-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`adm-modal${size === 'sm' ? ' adm-modal-sm' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button type="button" data-close className="adm-btn adm-btn-ghost adm-icon-btn" onClick={onClose} aria-label="Close"><X size={17} /></button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>,
    document.querySelector('.adm-root') ?? document.body,
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger, busy, onConfirm, onClose }: {
  title: string; body: React.ReactNode; confirmLabel: string; danger?: boolean; busy?: boolean; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Modal title={title} onClose={onClose} size="sm" footer={<>
      <button type="button" className="adm-btn" onClick={onClose}>Cancel</button>
      <button type="button" className={`adm-btn ${danger ? 'adm-btn-danger' : 'adm-btn-primary'}`} disabled={busy} onClick={onConfirm}>{busy ? 'Working…' : confirmLabel}</button>
    </>}>
      <div className="adm-text-2" style={{ fontSize: 14, lineHeight: 1.55 }}>{body}</div>
    </Modal>
  );
}

// --- toast ------------------------------------------------------------------------------

export function useToast() {
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(t);
  }, [toast]);
  const show = useCallback((text: string, error = false) => setToast({ text, error }), []);
  const node = toast ? (
    <div className={`adm-toast${toast.error ? ' is-error' : ''}`} role="status">
      {toast.error ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}{toast.text}
    </div>
  ) : null;
  return { show, node };
}

// --- empty + pager --------------------------------------------------------------------

export function Empty({ title, copy, icon }: { title: string; copy?: string; icon?: React.ReactNode }) {
  return <div className="adm-empty">{icon || <Inbox />}<strong>{title}</strong>{copy && <p>{copy}</p>}</div>;
}

export function Pager({ skip, take, total, onPage }: { skip: number; take: number; total: number; onPage: (skip: number) => void }) {
  if (total <= take) return total ? <div className="adm-pager"><span>{total.toLocaleString('en')} total</span></div> : null;
  const from = skip + 1;
  const to = Math.min(total, skip + take);
  return (
    <div className="adm-pager">
      <span>{from.toLocaleString('en')}–{to.toLocaleString('en')} of {total.toLocaleString('en')}</span>
      <div>
        <button type="button" className="adm-btn adm-btn-sm" disabled={skip === 0} onClick={() => onPage(Math.max(0, skip - take))}>Previous</button>
        <button type="button" className="adm-btn adm-btn-sm" disabled={to >= total} onClick={() => onPage(skip + take)}>Next</button>
      </div>
    </div>
  );
}

// --- activity row ------------------------------------------------------------------------

function ActionIcon({ action }: { action: string }) {
  if (action === 'auth.login') return <LogIn size={15} />;
  if (action === 'auth.login_failed') return <ShieldAlert size={15} />;
  if (action === 'auth.signup' || action === 'admin.user_create') return <UserPlus size={15} />;
  if (action === 'admin.password_reset') return <KeyRound size={15} />;
  if (action === 'admin.user_suspend') return <Ban size={15} />;
  if (action.endsWith('delete')) return <Trash2 size={15} />;
  if (action.startsWith('admin.')) return <Crown size={15} />;
  if (action.startsWith('event.')) return <CalendarDays size={15} />;
  if (action.startsWith('follow.')) return <Heart size={15} />;
  if (action.startsWith('ticket.')) return <Ticket size={15} />;
  return <PencilLine size={15} />;
}

function targetHref(item: ActivityItem) {
  if (!item.targetId) return null;
  if (item.targetType === 'user') return `/admin/users/${item.targetId}`;
  if (item.targetType === 'event') return `/events/${item.targetId}`;
  if (item.targetType === 'artist') return `/artists/${item.targetId}`;
  return null;
}

export function ActivityRow({ item, showActor = true, showDevice = false, currentId }: { item: ActivityItem; showActor?: boolean; showDevice?: boolean; currentId?: string }) {
  const tone = actionTone(item.action);
  const who = item.actor?.name || item.actorEmail || (item.action.startsWith('follow.') || item.action === 'ticket.reserve' ? 'Guest' : 'Unknown');
  const href = item.targetId && item.targetId === currentId ? null : targetHref(item);
  const device = showDevice ? deviceLabel(item.userAgent) : null;
  return (
    <div className="adm-feed-item">
      <span className={`adm-feed-icon is-${tone}`}><ActionIcon action={item.action} /></span>
      <div className="adm-feed-copy">
        <strong>{item.summary || actionLabel(item.action)}</strong>
        <div className="adm-feed-meta">
          <span>{actionLabel(item.action)}</span>
          {showActor && (item.actor ? <Link href={`/admin/users/${item.actor.id}`}>by {who}</Link> : <span>by {who}</span>)}
          {href && <Link href={href} target={href.startsWith('/admin') ? undefined : '_blank'}>Open</Link>}
          {item.source && item.source !== 'api' && <span>via {item.source === 'app' ? 'mobile app' : 'website'}</span>}
          {device && <span>{device}</span>}
          {showDevice && item.ip && <span>IP {item.ip}</span>}
        </div>
      </div>
      <time className="adm-feed-time" dateTime={item.createdAt} title={dateTime(item.createdAt)}>{timeAgo(item.createdAt)}</time>
    </div>
  );
}
