import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type Check = { status: 'idle' | 'running' | 'pass' | 'warn' | 'fail'; ms?: number; detail: string };

type HealthState = {
  config: Check;
  session: Check;
  database: Check;
};

const initial: HealthState = {
  config: { status: 'idle', detail: 'Not checked' },
  session: { status: 'idle', detail: 'Not checked' },
  database: { status: 'idle', detail: 'Not checked' },
};

function timed<T>(fn: () => Promise<T>) {
  const started = performance.now();
  return fn().then((value) => ({ value, ms: Math.round(performance.now() - started) }));
}

/** Development/support diagnostic. Do not render on public production screens. */
export function SupabaseHealthCheck() {
  const [state, setState] = useState<HealthState>(initial);

  const run = useCallback(async () => {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const configOk = Boolean(url && key);
    setState({
      config: { status: configOk ? 'pass' : 'fail', detail: configOk ? 'URL + public key are bound' : 'Missing Supabase env vars' },
      session: { status: 'running', detail: 'Checking auth session…' },
      database: { status: 'running', detail: 'Checking profiles read…' },
    });

    const sessionPromise = timed(() => supabase.auth.getSession());
    const databasePromise = timed(() =>
      // Intentional smoke test requested by the audit. RLS should normally reject this for anon.
      supabase.from('profiles').select('count', { count: 'exact' }).limit(1),
    );

    const [sessionResult, databaseResult] = await Promise.allSettled([sessionPromise, databasePromise]);

    if (sessionResult.status === 'fulfilled') {
      const { value, ms } = sessionResult.value;
      const session = value.data.session;
      console.info(`[SupabaseHealthCheck] auth.getSession ${ms}ms session=${Boolean(session)}`);
      setState((s) => ({ ...s, session: { status: 'pass', ms, detail: session ? 'Session available' : 'No active session (valid)' } }));
    } else {
      console.error('[SupabaseHealthCheck] auth.getSession failed', sessionResult.reason);
      setState((s) => ({ ...s, session: { status: 'fail', detail: String(sessionResult.reason?.message ?? sessionResult.reason) } }));
    }

    if (databaseResult.status === 'fulfilled') {
      const { value, ms } = databaseResult.value;
      console.info(`[SupabaseHealthCheck] profiles read ${ms}ms error=${value.error?.message ?? 'none'}`);
      if (value.error) {
        const permissionFailure = /permission|row-level security|JWT|not authenticated/i.test(value.error.message);
        setState((s) => ({ ...s, database: { status: permissionFailure ? 'warn' : 'fail', ms, detail: permissionFailure ? `RLS/auth blocked anonymous read as expected: ${value.error.message}` : value.error.message } }));
      } else {
        setState((s) => ({ ...s, database: { status: 'pass', ms, detail: `Read completed; count=${value.count ?? 'unknown'}` } }));
      }
    } else {
      console.error('[SupabaseHealthCheck] profiles read failed', databaseResult.reason);
      setState((s) => ({ ...s, database: { status: 'fail', detail: String(databaseResult.reason?.message ?? databaseResult.reason) } }));
    }
  }, []);

  useEffect(() => { void run(); }, [run]);

  return (
    <View className="rounded-2xl border border-divider bg-surface p-4">
      <Text className="mb-3 text-base font-semibold text-primary">Supabase Health Check</Text>
      {(Object.entries(state) as [keyof HealthState, Check][]).map(([name, check]) => (
        <View key={name} className="mb-2 flex-row items-center justify-between">
          <Text className="text-secondary">{name}</Text>
          <Text className={check.status === 'fail' ? 'text-danger' : check.status === 'warn' ? 'text-warning' : 'text-success'}>
            {check.status.toUpperCase()}{check.ms !== undefined ? ` · ${check.ms}ms` : ''}
          </Text>
        </View>
      ))}
      <Text className="mb-3 text-xs text-muted">{state.database.detail}</Text>
      <Pressable accessibilityRole="button" onPress={() => void run()} className="min-h-tap items-center justify-center rounded-xl bg-indigo px-4 py-3">
        <Text className="font-semibold text-white">Run checks again</Text>
      </Pressable>
    </View>
  );
}
