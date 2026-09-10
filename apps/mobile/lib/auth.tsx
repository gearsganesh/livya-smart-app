import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type AuthProfile = {
  id: string;
  email: string | null;
  name: string | null;
  subscription_tier: string;
  full_name?: string | null;
  avatar_url?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const redirectTo = Linking.createURL('auth/callback');

async function loadProfile(userId: string): Promise<AuthProfile | null> {
  const { data, error } = await supabase.from('profiles').select('id,email,name,subscription_tier,full_name,avatar_url').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data as AuthProfile | null;
}

async function completeOAuth(url: string) {
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === 'string' ? parsed.queryParams.code : undefined;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }
  const hash = url.split('#')[1];
  if (hash) {
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      if (error) throw error;
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    try {
      setProfile(await loadProfile(session.user.id));
    } catch (error) {
      console.warn('Profile load failed', error);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    }).finally(() => {
      if (mounted) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    void refreshProfile();
  }, [session?.user?.id, refreshProfile]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name, full_name: name } } });
    if (error) throw error;
    return { needsEmailConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signInWithProvider = useCallback(async (provider: 'google' | 'apple') => {
    if (provider === 'apple' && Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) throw new Error('Apple Sign In is not available on this device');
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error('Apple did not return an identity token');
      const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken });
      if (error) throw error;
      if (data.user && credential.fullName) {
        const parts = [credential.fullName.givenName, credential.fullName.middleName, credential.fullName.familyName].filter(Boolean);
        if (parts.length) await supabase.auth.updateUser({ data: { full_name: parts.join(' ') } });
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error) throw error;
    if (!data.url) throw new Error(`No ${provider} OAuth URL returned`);
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') await completeOAuth(result.url);
    else if (result.type !== 'cancel' && result.type !== 'dismiss') throw new Error(`${provider} authentication did not complete`);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ session, user: session?.user ?? null, profile, loading, signUp, signIn, signInWithProvider, signOut, refreshProfile }), [session, profile, loading, signUp, signIn, signInWithProvider, signOut, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
