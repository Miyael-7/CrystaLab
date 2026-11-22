/**
 * Almacén de estado mínimo (sin dependencias) basado en useSyncExternalStore.
 * Permite que varias páginas compartan estado; por ejemplo, el comparador
 * FCC/BCC puede cargar un sistema en el simulador de Schmid.
 */
import { useSyncExternalStore } from 'react';

export interface Store<T> {
  get: () => T;
  set: (patch: Partial<T> | ((s: T) => Partial<T>)) => void;
  reset: () => void;
  subscribe: (fn: () => void) => () => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set: (patch) => {
      const p = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...p };
      listeners.forEach((l) => l());
    },
    reset: () => {
      state = initial;
      listeners.forEach((l) => l());
    },
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useStore<T extends object>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
