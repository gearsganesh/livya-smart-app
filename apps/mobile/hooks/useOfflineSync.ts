import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type OfflineSyncState = {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  pendingMutations: number;
  isSyncing: boolean;
};

const OfflineSyncContext = createContext<OfflineSyncState | null>(null);

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const pendingMutations = useIsMutating({ mutationKey: ['offline-submit'] });

  useEffect(() => {
    const applyState = (state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setIsInternetReachable(state.isInternetReachable);
      onlineManager.setOnline(online);
      if (online) {
        void queryClient.resumePausedMutations();
        void queryClient.invalidateQueries();
      }
    };

    const unsubscribe = NetInfo.addEventListener(applyState);
    void NetInfo.fetch().then(applyState);
    return unsubscribe;
  }, [queryClient]);

  const value = useMemo(() => ({
    isOnline,
    isInternetReachable,
    pendingMutations,
    isSyncing: pendingMutations > 0 && isOnline,
  }), [isOnline, isInternetReachable, pendingMutations]);

  return <OfflineSyncContext.Provider value={value}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync() {
  const value = useContext(OfflineSyncContext);
  if (!value) throw new Error('useOfflineSync must be used inside OfflineSyncProvider');
  return value;
}
