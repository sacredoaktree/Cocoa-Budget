import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Supabase project config ──────────────────────────────────────────────────
export const SUPABASE_URL = 'https://czxrnmwntwokhcjbqvgs.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6eHJubXdudHdva2hjamJxdmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDU1NDIsImV4cCI6MjA5NTI4MTU0Mn0.Uy-jMlbRFVuEoiVGEBQKvMRJBJOIqJMJJGkBQkjWFzM';

// ─── Secure storage adapter for React Native ─────────────────────────────────
// Uses expo-secure-store on native, localStorage on web.
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { return Promise.resolve(localStorage.getItem(key)); } catch { return Promise.resolve(null); }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web') {
      try { localStorage.removeItem(key); } catch {}
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
