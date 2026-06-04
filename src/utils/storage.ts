import { createJSONStorage, StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── Platform-aware storage adapter ──────────────────────────────────────────
// Uses localStorage on web; AsyncStorage on native (iOS/Android)
const _webStorage: StateStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

const _nativeStorage: StateStorage = {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

// Cross-platform storage adapter.
export const cocoaStorage = createJSONStorage(() =>
  Platform.OS === 'web' ? _webStorage : _nativeStorage
);
