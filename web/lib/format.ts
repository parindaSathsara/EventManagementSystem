export function eventDate(value: string, withYear = false) {
  return new Intl.DateTimeFormat('en-LK', {
    weekday: 'short', day: 'numeric', month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(value));
}

export function eventTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export function monthDay(value: string) {
  const date = new Date(value);
  return {
    month: new Intl.DateTimeFormat('en-LK', { month: 'short' }).format(date).toUpperCase(),
    day: new Intl.DateTimeFormat('en-LK', { day: '2-digit' }).format(date),
  };
}

export function compactNumber(value = 0) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function getImage(event: { bannerImageUrl?: string | null; coverImageUrl?: string | null; flyers?: string[] }) {
  return mediaUrl(event.bannerImageUrl || event.coverImageUrl || event.flyers?.[0] || null);
}

/** Route backend uploads through Next so Helmet's same-origin policy is respected. */
export function mediaUrl(value?: string | null) {
  if (!value) return null;
  if (value.startsWith('/media/')) return value;
  if (value.startsWith('/uploads/')) return `/media/${value.slice('/uploads/'.length)}`;
  try {
    const parsed = new URL(value);
    const marker = '/uploads/';
    const index = parsed.pathname.indexOf(marker);
    if (index >= 0) return `/media/${parsed.pathname.slice(index + marker.length)}${parsed.search}`;
  } catch {
    return value;
  }
  return value;
}

export function initials(name = 'Stage') {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
