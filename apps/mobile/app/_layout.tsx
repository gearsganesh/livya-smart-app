import { Stack } from 'expo-router';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import '../global.css';
import { AuthProvider } from '../lib/auth';
import { persistOptions, queryClient } from '../lib/query-client';
import { ThemeProvider } from '../lib/theme';
import { OfflineSyncProvider } from '../hooks/useOfflineSync';

export default function RootLayout() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      onSuccess={() => {
        // Paused mutations are replayed by OfflineSyncProvider once NetInfo
        // confirms a usable connection. Keeping this callback empty avoids
        // sending queued health data before network state has been evaluated.
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <OfflineSyncProvider>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="patient" />
              <Stack.Screen name="admin" />
            </Stack>
          </OfflineSyncProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
