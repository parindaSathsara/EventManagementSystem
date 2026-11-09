'use client';

import { api } from './api';

// --- types (mirror backend/src/modules/admin) ---------------------------------

export type Role = 'customer' | 'artist' | 'admin';
export type Range = 'today' | '7d' | '30d' | '90d';

export type Actor = { id: string; name: string; email: string; role: Role; avatarUrl?: string | null } | null;

export type ActivityItem = {
  id: string;
  action: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  targetType: string | null;
  targetId: string | null;
  summary: string | null;
  metaJson: string | null;
  ip: string | null;
  userAgent: string | null;
  source: string | null;
  createdAt: string;
  actor: Actor;
};

export type PeriodCounts = {
  visitors: number;
  pageViews: number;
  eventViews: number;
  profileViews: number;
  appOpens: number;
  logins: number;
  failedLogins: number;
  activeUsers: number;
  eventsCreated: number;
  follows: number;
  actions: number;
  newAccounts: number;
};

export type SeriesPoint = {
  bucket: string;
  views: number;
  visitors: number;
  eventViews: number;
  webViews: number;
  appViews: number;
  logins: number;
  failedLogins: number;
  signups: number;
  actions: number;
};

export type EventSummary = {
  id: string;
  title: string;
  startsAt: string;
  status: string;
  cityName: string;
  venueName?: string | null;
  flyerUrl: string | null;
  organizer: { id: string; handle: string; name: string } | null;
};

export type Overview = {
  range: Range;
  generatedAt: string;
  window: { from: string; to: string; hourly: boolean; days: number };
  current: PeriodCounts;
  previous: PeriodCounts;
  series: SeriesPoint[];
  sources: Array<{ source: 'web' | 'app'; views: number; visitors: number }>;
  topEvents: Array<EventSummary & { views: number; visitors: number; appViews: number }>;
  topOrganizers: Array<{
    id: string; userId: string; handle: string; name: string; avatarUrl: string | null; isVerified: boolean;
    followerCount: number; events: number; eventViews: number; profileViews: number; total: number;
  }>;
  topPages: Array<{ path: string; label: string | null; views: number; visitors: number }>;
  totals: {
    users: { total: number; customers: number; organizers: number; admins: number; disabled: number };
    organizers: { total: number; verified: number };
    events: { total: number; upcoming: number; byStatus: Record<string, number> };
    reels: number;
    followers: { guests: number; accounts: number; total: number };
    devices: { total: number; activeWeek: number; pushReady: number };
    allTime: { views: number; visitors: number };
  };
  live: { visitors: number };
  recentActivity: ActivityItem[];
  recentLogins: ActivityItem[];
};

export type OrganizerProfile = {
  id: string;
  handle: string;
  category: string | null;
  bio: string | null;
  isVerified: boolean;
  isPreferred: boolean;
  followerCount: number;
  _count: { events: number; reels: number };
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  city: string | null;
  avatarUrl: string | null;
  role: Role;
  lastLoginAt: string | null;
  loginCount: number;
  disabledAt: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
  artist: OrganizerProfile | null;
  _count: { tickets: number; follows: number };
};

export type UserList = { items: AdminUser[]; total: number; counts: Partial<Record<Role, number>> };

export type UserDetail = {
  user: AdminUser;
  createdBy: { id: string; name: string } | null;
  failedLoginsLast30d: number;
  activity: ActivityItem[];
  events: Array<EventSummary & { views: number; visitors: number }>;
};

export type AdminEvent = EventSummary & {
  createdAt: string;
  updatedAt: string;
  hasTicketLink: boolean;
  saves: number;
  reservations: number;
  views: number;
  visitors: number;
};

export type EventList = { items: AdminEvent[]; total: number; counts: Record<string, number> };
export type ActivityList = { items: ActivityItem[]; total: number; facets: Record<string, number> };

export type OrganizerInput = { handle?: string; category?: string | null; bio?: string | null; isVerified?: boolean; isPreferred?: boolean };
export type CreateUserInput = { name: string; email: string; password: string; phone?: string | null; role: Role; organizer?: OrganizerInput | null };
export type UpdateUserInput = Partial<{ name: string; email: string; phone: string | null; role: Role; disabled: boolean; organizer: OrganizerInput | null }>;

// --- API ------------------------------------------------------------------------

function qs(params: Record<string, string | number | undefined | null>) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export const adminApi = {
  overview: (range: Range) => api.get<Overview>(`/admin/overview${qs({ range })}`),
  users: (params: { q?: string; role?: Role | ''; status?: string; sort?: string; take?: number; skip?: number }) =>
    api.get<UserList>(`/admin/users${qs(params)}`),
  user: (id: string) => api.get<UserDetail>(`/admin/users/${encodeURIComponent(id)}`),
  createUser: (input: CreateUserInput) => api.post<AdminUser>('/admin/users', input),
  updateUser: (id: string, input: UpdateUserInput) => api.patch<AdminUser>(`/admin/users/${encodeURIComponent(id)}`, input),
  resetPassword: (id: string, password: string) => api.post<null>(`/admin/users/${encodeURIComponent(id)}/password`, { password }),
  deleteUser: (id: string) => api.delete<null>(`/admin/users/${encodeURIComponent(id)}`),
  events: (params: { q?: string; status?: string; when?: string; organizerId?: string; take?: number; skip?: number }) =>
    api.get<EventList>(`/admin/events${qs(params)}`),
  setEventStatus: (id: string, status: string) => api.patch<{ id: string; status: string }>(`/admin/events/${encodeURIComponent(id)}/status`, { status }),
  deleteEvent: (id: string) => api.delete<null>(`/admin/events/${encodeURIComponent(id)}`),
  activity: (params: { category?: string; action?: string; actorId?: string; q?: string; range?: string; take?: number; skip?: number }) =>
    api.get<ActivityList>(`/admin/activity${qs(params)}`),
};

// --- presentation helpers ----------------------------------------------------------

export const ROLE_LABEL: Record<Role, string> = { customer: 'Guest account', artist: 'Organizer', admin: 'Super admin' };

export const RANGE_LABEL: Record<Range, string> = { today: 'Today', '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days' };

export const ACTIVITY_CATEGORIES: Array<{ key: string; label: string }> = [
  { key: 'auth', label: 'Sign-ins' },
  { key: 'admin', label: 'Admin actions' },
  { key: 'event', label: 'Events' },
  { key: 'artist', label: 'Organizer profiles' },
  { key: 'profile', label: 'Profiles' },
  { key: 'follow', label: 'Follows' },
  { key: 'ticket', label: 'Tickets' },
];

const ACTION_LABEL: Record<string, string> = {
  'auth.login': 'Signed in',
  'auth.login_failed': 'Failed sign-in',
  'auth.signup': 'Signed up',
  'profile.update': 'Profile updated',
  'event.create': 'Event created',
  'event.update': 'Event updated',
  'event.delete': 'Event deleted',
  'artist.become': 'Became organizer',
  'artist.update': 'Organizer profile updated',
  'follow.add': 'Followed',
  'follow.remove': 'Unfollowed',
  'ticket.reserve': 'Ticket reserved',
  'admin.user_create': 'Account created',
  'admin.user_update': 'Account edited',
  'admin.user_role': 'Role changed',
  'admin.user_suspend': 'Account suspended',
  'admin.user_reactivate': 'Account reactivated',
  'admin.user_delete': 'Account deleted',
  'admin.password_reset': 'Password reset',
  'admin.event_status': 'Event status changed',
  'admin.event_delete': 'Event removed',
};

export function actionLabel(action: string) {
  return ACTION_LABEL[action] || action.replace(/[._]/g, ' ');
}

/** Tone for the activity dot: alerts stand out, routine stays quiet. */
export function actionTone(action: string): 'critical' | 'warning' | 'good' | 'accent' | 'neutral' {
  if (action === 'auth.login_failed' || action.endsWith('_delete') || action === 'event.delete') return 'critical';
  if (action === 'admin.user_suspend' || action === 'admin.password_reset' || action === 'admin.user_role') return 'warning';
  if (action === 'auth.login' || action === 'auth.signup' || action === 'admin.user_reactivate') return 'good';
  if (action.startsWith('admin.')) return 'accent';
  return 'neutral';
}

const compactFmt = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const fullFmt = new Intl.NumberFormat('en');

export function compact(n: number) {
  return Math.abs(n) < 10000 ? fullFmt.format(n) : compactFmt.format(n);
}

export function full(n: number) {
  return fullFmt.format(n);
}

/** Signed change vs the previous period, or null when there's no baseline. */
export function delta(current: number, previous: number): { pct: number | null; diff: number } {
  const diff = current - previous;
  if (!previous) return { pct: current ? null : 0, diff };
  return { pct: Math.round((diff / previous) * 1000) / 10, diff };
}

export function timeAgo(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return 'Just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Axis/tooltip label for a series bucket ("2026-11-09" or "2026-11-09 14"). */
export function bucketLabel(bucket: string, hourly: boolean, long = false) {
  if (hourly) {
    const hour = Number(bucket.slice(11, 13));
    const suffix = hour < 12 ? 'am' : 'pm';
    const h12 = hour % 12 || 12;
    return long ? `${h12}:00 ${suffix} – ${h12}:59 ${suffix}` : `${h12}${suffix}`;
  }
  const d = new Date(`${bucket}T00:00:00`);
  return d.toLocaleDateString('en-GB', long ? { weekday: 'short', day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short' });
}

/** "Chrome on Windows" from a user agent — enough to spot an odd sign-in. */
export function deviceLabel(ua: string | null | undefined) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : /okhttp|Expo|ReactNative/i.test(ua) ? 'Stage app' : null;
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iOS/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : null;
  if (browser && os) return `${browser} on ${os}`;
  return browser || os || null;
}
