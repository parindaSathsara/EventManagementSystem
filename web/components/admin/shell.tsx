'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, CalendarRange, ExternalLink, LayoutDashboard, LoaderCircle, LogOut, Menu, UsersRound, X } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { StageBadge, StageWordmark } from '@/components/brand-logo';
import { AdminAvatar } from './ui';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users & access', icon: UsersRound },
  { href: '/admin/events', label: 'Events', icon: CalendarRange },
  { href: '/admin/activity', label: 'Activity log', icon: Activity },
];

function Brand() {
  return (
    <Link href="/admin" className="adm-brand" aria-label="Stage admin console">
      <StageBadge className="adm-brand-badge" />
      <span className="adm-brand-copy"><StageWordmark className="adm-brand-word" /><span>Super admin</span></span>
    </Link>
  );
}

/**
 * Console chrome + access gate. The login page renders bare; every other
 * /admin route needs a signed-in `admin`, otherwise it goes to /admin/login.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLogin = pathname === '/admin/login';
  const allowed = !!user && user.role === 'admin';

  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!ready || isLogin || allowed) return;
    router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, isLogin, allowed, pathname, router]);

  if (isLogin) return <div className="adm-root">{children}</div>;
  if (!ready || !allowed) {
    return <div className="adm-root"><div className="adm-boot"><div><LoaderCircle size={18} className="adm-spin" />Opening the console…</div></div></div>;
  }

  return (
    <div className="adm-root">
      {menuOpen && <div className="adm-scrim" onClick={() => setMenuOpen(false)} />}
      <aside className={`adm-side${menuOpen ? ' is-open' : ''}`}>
        <Brand />
        <div className="adm-nav-label">Monitor</div>
        <nav className="adm-nav" aria-label="Admin navigation">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={active ? 'is-active' : ''} aria-current={active ? 'page' : undefined}><Icon size={17} />{label}</Link>;
          })}
        </nav>
        <div className="adm-nav-label">Shortcuts</div>
        <nav className="adm-nav" aria-label="Shortcuts">
          <Link href="/" target="_blank"><ExternalLink size={17} />Open the website</Link>
          <Link href="/studio"><CalendarRange size={17} />Organizer studio</Link>
        </nav>
        <div className="adm-side-foot">
          <div className="adm-me">
            <AdminAvatar name={user.name} src={user.avatarUrl} size="sm" />
            <div className="adm-me-copy"><strong>{user.name}</strong><span>{user.email}</span></div>
          </div>
          <div className="adm-side-actions">
            <button type="button" className="adm-btn adm-btn-sm" onClick={() => { logout(); router.replace('/admin/login'); }}><LogOut size={14} />Sign out</button>
          </div>
        </div>
      </aside>
      <div style={{ minWidth: 0 }}>
        <header className="adm-topbar">
          <Brand />
          <button type="button" className="adm-btn adm-icon-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu" aria-expanded={menuOpen}>
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
