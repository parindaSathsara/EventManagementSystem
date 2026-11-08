'use client';

import { useEffect, useState } from 'react';
import { initials, mediaUrl } from '@/lib/format';

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function MediaImage({ src, fallbackSrc = '/images/stage-night-hero.webp', alt = '', ...props }: ImageProps) {
  const resolved = mediaUrl(src) || src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(resolved);
  // Follow a changed src (e.g. artwork replaced in the editor).
  useEffect(() => { setCurrentSrc(resolved); }, [resolved]);

  return (
    <img
      {...props}
      src={currentSrc}
      alt={alt}
      onError={() => {
        if (currentSrc !== fallbackSrc) setCurrentSrc(fallbackSrc);
      }}
    />
  );
}

/**
 * Event flyer for a SQUARE frame (the parent sets `aspect-ratio: 1`,
 * `position: relative` and `overflow: hidden`). Same rule as the mobile app:
 * the flyer is laid out at full width with its TOP pinned to the top of the
 * square — a square flyer fills it exactly, a portrait flyer shows from its
 * start (bottom clipped), and a landscape flyer sits at the top over a
 * blurred copy of itself so the frame never shows an empty gap.
 */
export function FlyerImage({ src, alt = '', seed, compact = false }: { src?: string | null; alt?: string; seed?: string; compact?: boolean }) {
  const resolved = mediaUrl(src) || src || null;
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [resolved]);

  // No flyer (or it failed to load): an honest, branded placeholder — NOT a
  // stock photo that passes for a real flyer (client feedback 2026-11-08:
  // "even without a flyer, a flyer appears").
  if (!resolved || failed) return <FlyerPlaceholder seed={seed} compact={compact} />;
  return (
    <>
      <img className="flyer-backdrop" src={resolved} alt="" aria-hidden decoding="async" />
      <img className="flyer-img" src={resolved} alt={alt} decoding="async" onError={() => setFailed(true)} />
    </>
  );
}

// Stage-light colourways for flyer-less events: [glow, base]. Picked per
// event (stable), so a row of placeholders reads as a lineup, not a wall.
const STAGE_LIGHTS: Array<[string, string]> = [
  ['#ff3b3b', '#2a0408'], // stage red
  ['#ff7a3d', '#2b0d04'], // amber
  ['#ff2f87', '#2a0516'], // magenta
  ['#a66bff', '#150a2e'], // ultraviolet
  ['#ff4d6d', '#24040f'], // rose
  ['#3dd9ff', '#03161f'], // laser cyan
];

function lightFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return STAGE_LIGHTS[h % STAGE_LIGHTS.length];
}

/** Branded "flyer drops soon" tile — the Stage mark under coloured stage lights. */
export function FlyerPlaceholder({ seed, compact = false }: { seed?: string; compact?: boolean }) {
  const [glow, base] = lightFor(seed);
  return (
    <span className={`flyer-placeholder${compact ? ' is-compact' : ''}`} style={{ '--glow': glow, '--base': base } as React.CSSProperties}>
      <span className="flyer-placeholder-beams" aria-hidden />
      <img src="/brand/stage-mark-trim.png" alt="" aria-hidden />
      {!compact && <small>Flyer drops soon</small>}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 'medium',
  className = '',
}: {
  name: string;
  src?: string | null;
  size?: 'small' | 'medium' | 'large' | 'hero';
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const resolved = mediaUrl(src) || src;

  return (
    <span className={`avatar avatar-${size}${className ? ` ${className}` : ''}`} aria-label={name}>
      {resolved && !failed ? <img src={resolved} alt={`${name} profile`} onError={() => setFailed(true)} /> : <span aria-hidden>{initials(name)}</span>}
    </span>
  );
}
