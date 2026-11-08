import { CalendarSearch, LoaderCircle, RadioTower } from 'lucide-react';

export function LoadingState({ label = 'Loading the lineup' }: { label?: string }) {
  return <div className="state-card loading-state" aria-live="polite"><LoaderCircle className="spin" /><h3>{label}</h3><p>Just a moment while we get everything ready.</p></div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state-card error-state" role="alert"><RadioTower /><h3>We couldn&apos;t load this yet</h3><p>{message}</p>{retry && <button className="button button-secondary" onClick={retry}>Try again</button>}</div>;
}

/** Placeholder cards while events load — the grid keeps its shape. */
export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="event-grid" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: count }, (_, index) => (
        <div className="event-card skeleton-card" key={index} aria-hidden>
          <div className="skeleton-media" />
          <div className="event-card-body"><span className="skeleton-line short" /><span className="skeleton-line" /><span className="skeleton-line mid" /></div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="state-card"><CalendarSearch /><h3>{title}</h3><p>{copy}</p></div>;
}
