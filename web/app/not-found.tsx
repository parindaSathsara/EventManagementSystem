import Link from 'next/link';

export default function NotFound() { return <div className="narrow-shell"><div className="state-card"><p className="eyebrow">404</p><h1>Wrong stage.</h1><p>The page you are looking for has moved or the lights are out.</p><Link className="button button-primary" href="/events">Discover events</Link></div></div>; }
