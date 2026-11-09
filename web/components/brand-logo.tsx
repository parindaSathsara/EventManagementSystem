import { useId } from 'react';
import { BRAND } from './brand-paths';

/**
 * The Stage logo — the client's own mark (slanted bars around the sound wave,
 * the same mark as the app icon) with the STAGE wordmark beside it.
 *
 * Fully vector (paths in ./brand-paths, generated from the client's master
 * artwork by Project/scripts/build-brand-svg.py), so it is sharp at every
 * size and identical to the app's logo. One component so the header, hero
 * and footer can never drift apart.
 *
 *   variant="badge" — red gradient tile + white mark: header + footer
 *   variant="mark"  — the bare white mark: the home hero
 *
 * Sizes come from CSS: the icon's width/height, and the wordmark's
 * font-size (its cap height is .73em).
 */
export function BrandLogo({ variant = 'badge', className = '' }: { variant?: 'badge' | 'mark'; className?: string }) {
  return (
    <span className={`brand-lockup brand-lockup-${variant}${className ? ` ${className}` : ''}`}>
      {variant === 'badge' ? <StageBadge className="brand-lockup-icon" /> : <StageMark className="brand-lockup-icon" />}
      <StageWordmark className="brand-lockup-name" />
    </span>
  );
}

const { mark, wordmark, badge } = BRAND;

export function StageMark({ className, fill = 'currentColor' }: { className?: string; fill?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${mark.width} ${mark.height}`} fill={fill} aria-hidden focusable="false">
      {mark.paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}

export function StageBadge({ className }: { className?: string }) {
  const id = `stage-badge-${useId().replace(/:/g, '')}`;
  const size = 100;
  const s = (size * badge.markScale) / Math.max(mark.width, mark.height);
  const tx = (size - mark.width * s) / 2;
  const ty = (size - mark.height * s) / 2;
  return (
    <svg className={className} viewBox={`0 0 ${size} ${size}`} aria-hidden focusable="false">
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="70.7%">
          {badge.stops.map((stop) => <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />)}
        </radialGradient>
      </defs>
      <rect width={size} height={size} rx={size * badge.radius} fill={`url(#${id})`} />
      <g fill="#fff" transform={`translate(${tx} ${ty}) scale(${s})`}>
        {mark.paths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
}

export function StageWordmark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox={`0 0 ${wordmark.width} ${wordmark.height}`} fill="currentColor" role="img" aria-label="Stage">
      {wordmark.paths.map((d, i) => <path key={i} d={d} />)}
    </svg>
  );
}
