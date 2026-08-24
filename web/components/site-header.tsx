'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, CalendarDays, Flame, Menu, Search, Ticket, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './auth-provider';
import { Avatar } from './media';

const links = [
  { href: '/events', label: 'Discover' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/artists', label: 'Artists' },
  { href: '/reels', label: 'Reels' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="nav-wrap">
        <Link className="brand" href="/" aria-label="Stage home">
          <img className="brand-wordmark" src="/brand/stage-wordmark.png" alt="Stage" />
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
          {user && <Link className="mobile-only" href="/alerts" onClick={() => setOpen(false)}>Alerts</Link>}
        </nav>

        <div className="nav-actions">
          <Link className="stage-live-pill desktop-only" href="/events"><Flame size={13} fill="currentColor" /><span>Discover live</span></Link>
          <Link className="icon-link" href="/events?focus=search" aria-label="Search"><Search size={19} /></Link>
          {user && <Link className="icon-link" href="/alerts" aria-label="Upcoming alerts"><Bell size={18} /></Link>}
          {user && <Link className="icon-link" href="/tickets" aria-label="My tickets"><Ticket size={19} /></Link>}
          <Link className="button button-ghost desktop-only" href="/studio">For organizers</Link>
          <Link className="account-link desktop-only" href={user ? '/account' : '/auth'}>
            {user ? <Avatar name={user.name} src={user.avatarUrl} size="small" /> : <span className="avatar avatar-small"><UserRound size={17} /></span>}
            <span>{user ? user.name.split(' ')[0] : 'Sign in'}</span>
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
  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">
      <Link className={pathname.startsWith('/events') ? 'active' : ''} href="/events"><Search /><span>Explore</span></Link>
      <Link className={pathname.startsWith('/calendar') ? 'active' : ''} href="/calendar"><CalendarDays /><span>Calendar</span></Link>
      <Link className={pathname.startsWith('/tickets') ? 'active' : ''} href="/tickets"><Ticket /><span>Tickets</span></Link>
      <Link className={pathname.startsWith('/account') || pathname.startsWith('/auth') ? 'active' : ''} href={user ? '/account' : '/auth'}><UserRound /><span>{user ? 'Profile' : 'Sign in'}</span></Link>
    </nav>
  );
}
