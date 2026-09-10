import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { apiFetch } from './api';

export type OfflineMutationVariables = {
  path: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export const OFFLINE_MUTATION_KEY = ['offline-submit'] as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 7 * 24 * 60 * 60 * 1000,
      retry: 2,
      networkMode: 'offlineFirst',
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3,
      retryDelay: (attempt) => Math.min(30_000, 1_000 * 2 ** attempt),
    },
  },
});

// Persisted mutations need a stable mutationFn because functions themselves cannot
// be serialized by React Query. The variables contain only the API contract.
queryClient.setMutationDefaults(OFFLINE_MUTATION_KEY, {
  mutationFn: async (variables: OfflineMutationVariables) =>
    apiFetch(variables.path, {
      method: variables.method ?? 'POST',
      body: variables.body === undefined ? undefined : JSON.stringify(variables.body),
    }),
  networkMode: 'offlineFirst',
  retry: 3,
});

export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'livya-react-query-cache-v1',
  throttleTime: 1_000,
});

export const persistOptions = {
  persister: queryPersister,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  dehydrateOptions: {
    // Only paused mutations are queued for offline replay. Completed mutations
    // should never become a second source of truth in local storage.
    shouldDehydrateMutation: (mutation: { state: { isPaused: boolean } }) => mutation.state.isPaused,
  },
};
