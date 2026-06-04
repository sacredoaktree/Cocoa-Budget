/**
 * Supabase client configuration
 *
 * Uses AsyncStorage on native and localStorage on web for auth session persistence.
 * Note: react-native-url-polyfill is NOT needed for @supabase/supabase-js v2.x+
 * as it bundles its own URL handling.
 */
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Supabase project config ──────────────────────────────────────────────────
export const SUPABASE_URL = 'https://czxrnmwntwokhcjbqvgs.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6eHJubXdudHdva2hjamJxdmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MDU1NDIsImV4cCI6MjA5NTI4MTU0Mn0.Uy-jMlbRFVuEoiVGEBQKvMRJBJOIqJMJJGkBQkjWFzM';

// ─── Storage adapter for auth sessions ───────────────────────────────────────
const AuthStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch {}
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// ─── Supabase client ──────────────────────────────────────────────────────────
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AuthStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
