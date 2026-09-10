import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  console.warn('Supabase environment variables are not configured yet.');
}

export const supabase = createClient(url ?? '', publishableKey ?? '', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});
