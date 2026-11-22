import { describe, expect, it } from 'vitest';
import { frac } from './format';

describe('fracciones', () => {
  it.each<[number, string]>([
    [0, '0'], [1, '1'], [0.5, '1/2'], [1 / 3, '1/3'], [2 / 3, '2/3'], [0.25, '1/4'], [-1, '−1'], [-0.5, '−1/2'], [0.123456, '0.12'],
  ])('%s → %s', (x, s) => {
    expect(frac(x)).toBe(s);
  });
});
