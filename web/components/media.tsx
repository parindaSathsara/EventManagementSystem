'use client';

import { useState } from 'react';
import { initials, mediaUrl } from '@/lib/format';

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc?: string;
};

export function MediaImage({ src, fallbackSrc = '/images/stage-night-hero.webp', alt = '', ...props }: ImageProps) {
  const resolved = mediaUrl(src) || src || fallbackSrc;
  const [currentSrc, setCurrentSrc] = useState(resolved);

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
