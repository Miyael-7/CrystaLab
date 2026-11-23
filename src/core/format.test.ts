import { describe, expect, it } from 'vitest';
import { frac, splitOverlines } from './format';

describe('fracciones', () => {
  it.each<[number, string]>([
    [0, '0'], [1, '1'], [0.5, '1/2'], [1 / 3, '1/3'], [2 / 3, '2/3'], [0.25, '1/4'], [-1, '−1'], [-0.5, '−1/2'], [0.123456, '0.12'],
  ])('%s → %s', (x, s) => {
    expect(frac(x)).toBe(s);
  });
});

describe('texto con índices negativos', () => {
  const show = (t: string) => splitOverlines(t).map((s) => (s.bar ? `-${s.text}` : s.text)).join('');
  it('marca la barra sobre el dígito correcto', () => {
    expect(show('[11̅1]')).toBe('[1-11]');
    expect(show('(1̅1̅1̅) no es')).toBe('(-1-1-1) no es');
    expect(show('sin índices')).toBe('sin índices');
  });
});
