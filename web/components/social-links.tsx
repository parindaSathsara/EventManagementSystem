/**
 * Facebook / Instagram / TikTok icons that open the artist's page on that
 * platform — the same row the app shows under each line-up artist (client
 * feedback 2026-11-08). Only links that were actually entered are shown.
 */

const ORDER = ['facebook', 'instagram', 'tiktok'] as const;
type Network = (typeof ORDER)[number];

const LABEL: Record<Network, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

function Icon({ network }: { network: Network }) {
  if (network === 'facebook') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1Z" /></svg>;
  }
  if (network === 'instagram') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="12" cy="12" r="3.9" fill="none" stroke="currentColor" strokeWidth="1.9" /><circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.6 3h-3.1v11.9a2.7 2.7 0 1 1-2.7-2.7c.3 0 .5 0 .8.1V9.1a6 6 0 0 0-.8-.1 5.8 5.8 0 1 0 5.8 5.8V8.9a7.3 7.3 0 0 0 4.2 1.3V7.1a4.2 4.2 0 0 1-4.2-4.1Z" /></svg>;
}

/** Accepts full URLs or bare handles (`@name` / `name`). */
function toUrl(network: Network, value: string) {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, '');
  if (network === 'facebook') return `https://facebook.com/${handle}`;
  if (network === 'instagram') return `https://instagram.com/${handle}`;
  return `https://www.tiktok.com/@${handle}`;
}

export function SocialLinks({ socials, name }: { socials?: Record<string, string> | null; name: string }) {
  const links = ORDER.filter((network) => socials?.[network]?.trim());
  if (!links.length) return null;
  return (
    <span className="social-links">
      {links.map((network) => (
        <a
          key={network}
          href={toUrl(network, socials![network])}
          target="_blank"
          rel="noreferrer"
          aria-label={`${name} on ${LABEL[network]}`}
          title={LABEL[network]}
        >
          <Icon network={network} />
        </a>
      ))}
    </span>
  );
}
