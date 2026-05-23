import { createJSONStorage, StateStorage } from 'zustand/middleware';

const _hasLocalStorage = (() => {
  try { return typeof localStorage !== 'undefined'; } catch { return false; }
})();

const _noop: StateStorage = {
  getItem:    () => null,
  setItem:    () => {},
  removeItem: () => {},
};

// Cross-platform storage adapter.
// Uses localStorage on web; falls back to an in-memory no-op on React Native / SSR
// so mobile stores continue working exactly as before.
export const cocoaStorage = createJSONStorage(() =>
  _hasLocalStorage ? localStorage : _noop
);
