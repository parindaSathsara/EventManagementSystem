/**
 * The Stage logo — the client's own mark (slanted bars around the sound wave,
 * the same mark as the app icon) with the STAGE name set beside it.
 *
 * Replaces the old striped "S" wordmark, which the client flagged as not
 * their logo (2026-11-08). One component so the header, hero and footer can
 * never drift apart again.
 *
 *   variant="badge" — the app-icon badge (red tile, white rim): header + footer
 *   variant="mark"  — the bare white mark, large: the home hero
 */
export function BrandLogo({ variant = 'badge', className = '' }: { variant?: 'badge' | 'mark'; className?: string }) {
  return (
    <span className={`brand-lockup brand-lockup-${variant}${className ? ` ${className}` : ''}`}>
      <img
        className="brand-lockup-icon"
        src={variant === 'badge' ? '/brand/app-icon.png' : '/brand/stage-mark-trim.png'}
        alt=""
        aria-hidden
      />
      <span className="brand-lockup-name">STAGE</span>
    </span>
  );
}
