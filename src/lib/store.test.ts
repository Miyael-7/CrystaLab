import { describe, expect, it } from 'vitest';
import { createStore } from './store';

describe('almacén de estado', () => {
  it('actualiza parcialmente, notifica y se restablece', () => {
    const s = createStore({ a: 1, b: 'x' });
    let calls = 0;
    const off = s.subscribe(() => calls++);
    s.set({ a: 2 });
    s.set((st) => ({ b: st.b + 'y' }));
    expect(s.get()).toEqual({ a: 2, b: 'xy' });
    expect(calls).toBe(2);
    s.reset();
    expect(s.get()).toEqual({ a: 1, b: 'x' });
    off();
    s.set({ a: 5 });
    expect(calls).toBe(3);
  });
});
