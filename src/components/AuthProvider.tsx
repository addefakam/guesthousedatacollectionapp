'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { ReactNode } from 'react';

export function AuthWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}

export function useAuth() {
  const { data: session, status } = useSession();
  const user = session?.user as Record<string, unknown> | undefined;
  return {
    session,
    status,
    user,
    isAdmin: user?.role === 'ADMIN',
    isCollector: user?.role === 'COLLECTOR',
    userName: user?.name as string | undefined,
    userId: user?.id as string | undefined,
  };
}
