import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cocoaStorage } from '../utils/storage';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/mockSeed';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  togglePrivacyMode: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (updates) =>
        set((s) => ({ settings: { ...s.settings, ...updates } })),
      togglePrivacyMode: () =>
        set((s) => ({ settings: { ...s.settings, privacyMode: !s.settings.privacyMode } })),
    }),
    { name: 'cocoa-settings', storage: cocoaStorage }
  )
);
