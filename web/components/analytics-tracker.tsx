'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { track } from '@/lib/analytics';

/**
 * One page view per route change. The admin console and organizer studio are
 * staff screens, not audience traffic, so they're left out of the numbers.
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/studio')) return;
    track({ kind: 'page', path: pathname });
  }, [pathname]);
  return null;
}
