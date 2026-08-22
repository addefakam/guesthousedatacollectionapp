'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  savePendingSurvey,
  getPendingSurveys,
  getPendingCount,
  deletePendingSurvey,
  PendingSurvey,
} from '@/lib/offline-store';

interface SyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncErrors: number;
  lastSyncAttempt: string | null;
}

export function useOfflineSync() {
  const [state, setState] = useState<SyncState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    isSyncing: false,
    syncErrors: 0,
    lastSyncAttempt: null,
  });

  const syncLock = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setState((s) => ({ ...s, pendingCount: count }));
    } catch {
      // IndexedDB not available
    }
  }, []);

  const syncPendingSurveys = useCallback(async () => {
    if (syncLock.current || !navigator.onLine) return;
    syncLock.current = true;
    setState((s) => ({ ...s, isSyncing: true, lastSyncAttempt: new Date().toISOString() }));

    let synced = 0;
    let errors = 0;

    try {
      const pending = await getPendingSurveys();

      for (const record of pending) {
        try {
          const response = await fetch('/api/guesthouses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record.data),
          });

          if (response.ok) {
            await deletePendingSurvey(record.id!);
            synced++;
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }
    } catch {
      errors++;
    }

    setState((s) => ({
      ...s,
      isSyncing: false,
      syncErrors: errors,
      pendingCount: Math.max(0, s.pendingCount - synced),
    }));

    syncLock.current = false;
    return { synced, errors };
  }, []);

  const saveOffline = useCallback(async (data: Record<string, unknown>) => {
    try {
      await savePendingSurvey(data);
      await refreshPendingCount();
      return true;
    } catch {
      return false;
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const goOnline = () => {
      setState((s) => ({ ...s, isOnline: true }));
      syncPendingSurveys();
      refreshPendingCount();
    };
    const goOffline = () => {
      setState((s) => ({ ...s, isOnline: false }));
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [syncPendingSurveys, refreshPendingCount]);

  return {
    ...state,
    syncPendingSurveys,
    saveOffline,
    refreshPendingCount,
  };
}
