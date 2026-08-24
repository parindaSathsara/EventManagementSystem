import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <Link className="brand footer-wordmark" href="/"><img src="/brand/stage-wordmark.png" alt="Stage" /></Link>
          <p>Sri Lanka&apos;s home for discovering live events and the people behind them.</p>
        </div>
        <div><h3>Discover</h3><Link href="/events">Events</Link><Link href="/calendar">Calendar</Link><Link href="/artists">Artists</Link><Link href="/reels">Reels</Link></div>
        <div><h3>Your Stage</h3><Link href="/studio">Organizer studio</Link><Link href="/tickets">My tickets</Link><Link href="/account">My account</Link></div>
        <div className="footer-cta"><h3>Ready to put on a show?</h3><p>Build a customer-friendly event page and start growing your crowd.</p><Link className="text-link" href="/studio">Create an event <ArrowUpRight size={15} /></Link></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Stage</span><span>Find it. Follow it. Be there.</span></div>
    </footer>
  );
}
