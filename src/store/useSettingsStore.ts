import { create } from 'zustand';
import { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../data/mockSeed';

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: DEFAULT_SETTINGS,
  updateSettings: (updates) =>
    set((s) => ({ settings: { ...s.settings, ...updates } })),
}));
