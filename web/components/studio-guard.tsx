'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import { LoadingState } from './states';

export function StudioGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, ready } = useAuth();
  useEffect(() => { if (ready && !user) router.replace('/auth?next=/studio'); }, [ready, user, router]);
  if (!ready || !user) return <div className="page-shell"><LoadingState label="Opening organizer studio" /></div>;
  return <>{children}</>;
}
