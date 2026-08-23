import { CalendarSearch, LoaderCircle, RadioTower } from 'lucide-react';

export function LoadingState({ label = 'Loading the lineup' }: { label?: string }) {
  return <div className="state-card loading-state" aria-live="polite"><LoaderCircle className="spin" /><h3>{label}</h3><p>Just a moment while we get everything ready.</p></div>;
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return <div className="state-card error-state" role="alert"><RadioTower /><h3>We couldn&apos;t load this yet</h3><p>{message}</p>{retry && <button className="button button-secondary" onClick={retry}>Try again</button>}</div>;
}

export function EmptyState({ title, copy }: { title: string; copy: string }) {
  return <div className="state-card"><CalendarSearch /><h3>{title}</h3><p>{copy}</p></div>;
}
