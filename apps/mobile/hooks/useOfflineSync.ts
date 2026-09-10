import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { onlineManager, useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

export function useOfflineSync() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);
  const pendingMutations = useIsMutating({ mutationKey: ['offline-submit'] });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setIsInternetReachable(state.isInternetReachable);
      onlineManager.setOnline(online);

      if (online) {
        // React Query resumes mutations that were paused by offlineFirst.
        void queryClient.resumePausedMutations();
        void queryClient.invalidateQueries();
      }
    });

    void NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      setIsInternetReachable(state.isInternetReachable);
      onlineManager.setOnline(online);
    });

    return unsubscribe;
  }, [queryClient]);

  return {
    isOnline,
    isInternetReachable,
    pendingMutations,
    isSyncing: pendingMutations > 0 && isOnline,
  };
}
