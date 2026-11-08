'use client';

import { useEffect } from 'react';

/**
 * Site-wide "ease in on scroll" for cards and section headings.
 *
 * One observer for the whole app instead of wrappers on every page:
 *  - content that loads later (event grids after a fetch) is picked up by a
 *    MutationObserver, so it animates too;
 *  - nothing is ever hidden unless this script runs (the hiding CSS only
 *    applies under `html.reveal-on`), and reduced-motion users are skipped.
 */
const TARGETS = [
  '.event-card', '.artist-card', '.journey-card', '.section-head', '.fact-tile',
  '.lineup-tile', '.organizer-card', '.location-card', '.metric', '.data-row', '.hero-event-card',
].join(',');

export function Reveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const root = document.documentElement;
    root.classList.add('reveal-on');

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    const seen = new WeakSet<Element>();
    const scan = () => {
      document.querySelectorAll<HTMLElement>(TARGETS).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        // Light stagger between siblings in the same grid.
        const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        el.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 70}ms`);
        io.observe(el);
      });
    };
    scan();
    let queued = 0;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => { queued = 0; scan(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { io.disconnect(); mo.disconnect(); root.classList.remove('reveal-on'); };
  }, []);
  return null;
}
