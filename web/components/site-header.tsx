'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, Flame, Menu, Search, ShieldCheck, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Avatar } from './media';
import { BrandLogo } from './brand-logo';

// Client feedback 2026-11-08: "Artists" covers organizers too; Reels and
// Tickets are hidden until they ship (Reels arrives in the next update,
// ticketing is handled on third-party platforms).
const links = [
  { href: '/events', label: 'Discover' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/artists', label: 'Artists & Organizers' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  // The super-admin console has its own chrome.
  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href="/" aria-label="Stage home">
          <BrandLogo />
        </Link>

        <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Primary navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className={pathname.startsWith(link.href) ? 'active' : ''} aria-current={pathname.startsWith(link.href) ? 'page' : undefined}>
              {link.label}
            </Link>
          ))}
          <Link className="mobile-only" href={user ? '/account' : '/auth'} onClick={() => setOpen(false)}>
            {user ? 'My account' : 'Sign in'}
          </Link>
          <Link className="mobile-only" href="/studio" onClick={() => setOpen(false)}>Organizer studio</Link>
          <Link className="mobile-only" href="/alerts" onClick={() => setOpen(false)}>Alerts</Link>
          {user?.role === 'admin' && <Link className="mobile-only" href="/admin" onClick={() => setOpen(false)}>Admin console</Link>}
        </nav>

        <div className="nav-actions">
          <Link className="stage-live-pill desktop-only" href="/events"><Flame size={13} fill="currentColor" /><span>Discover live</span></Link>
          <Link className="icon-link" href="/events?focus=search" aria-label="Search"><Search size={19} /></Link>
          {/* Alerts work for everyone — follows are per browser, like the app. */}
          <Link className="icon-link" href="/alerts" aria-label="Alerts"><Bell size={18} /></Link>
          {user?.role === 'admin' && <Link className="icon-link desktop-only" href="/admin" aria-label="Admin console" title="Admin console"><ShieldCheck size={18} /></Link>}
          <Link className="button button-ghost desktop-only" href="/studio">For organizers</Link>
          <Link className="account-link desktop-only" href={user ? '/account' : '/auth'}>
            {user ? <Avatar name={user.name} src={user.avatarUrl} size="small" /> : <span className="avatar avatar-small"><UserRound size={17} /></span>}
            <span className="account-name" title={user?.name}>{user ? user.name : 'Sign in'}</span>
          </Link>
          <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function MobileDock() {
  const pathname = usePathname();
  const { user } = useAuth();
  if (pathname.startsWith('/admin')) return null;
  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">
      <Link className={pathname.startsWith('/events') ? 'active' : ''} href="/events"><Search /><span>Explore</span></Link>
      <Link className={pathname.startsWith('/calendar') ? 'active' : ''} href="/calendar"><CalendarDays /><span>Calendar</span></Link>
      <Link className={pathname.startsWith('/alerts') ? 'active' : ''} href="/alerts"><Bell /><span>Alerts</span></Link>
      <Link className={pathname.startsWith('/account') || pathname.startsWith('/auth') ? 'active' : ''} href={user ? '/account' : '/auth'}><UserRound /><span>{user ? 'Profile' : 'Sign in'}</span></Link>
    </nav>
  );
}
