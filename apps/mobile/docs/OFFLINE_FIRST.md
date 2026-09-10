# LIVYA mobile offline-first architecture

## State flow

1. `PersistQueryClientProvider` hydrates the TanStack Query cache from AsyncStorage.
2. `OfflineSyncProvider` maps `@react-native-community/netinfo` state into TanStack Query's `onlineManager`.
3. Queries use `offlineFirst`, so cached dashboard data remains usable without a connection.
4. `useSubmitData` applies an optimistic update immediately, then submits through a persisted mutation.
5. When the device reconnects, paused mutations are resumed and affected queries are invalidated.

## Mutation persistence

`queryClient.setMutationDefaults(['offline-submit'], ...)` supplies the mutation function after hydration. This is required because JavaScript functions cannot be serialized into the persisted cache.

Only paused mutations are dehydrated. Completed mutations are not retained as a second source of truth.

## Privacy note

Offline persistence intentionally keeps the minimum request envelope needed to replay a queued mutation. Avoid placing secrets, access tokens, or unnecessary raw media in mutation variables. Health payloads stored locally remain device-local and should be treated as sensitive data.

## Navigation

The Expo Router shell uses a stack containing the application entry points and a nested bottom-tab navigator:

- Home: dashboard and quick check-in
- Health: monitoring, medicines, records and hydration
- Care: AI chat, nutrition, programmes, therapy and labs
- Store: catalogue, tests and subscriptions
- Profile: account and appearance settings

The prototype's wider detail flows can be added as stack routes without changing this shell.

## Theme

`ThemeProvider` persists `light`, `dark`, or `system` and drives NativeWind's `dark:` classes. The same provider is available to every route.
