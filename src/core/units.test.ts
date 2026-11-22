import { describe, expect, it } from 'vitest';
import {
  areaToM2,
  bestStressUnit,
  circularArea,
  forceToN,
  formatNumber,
  formatStress,
  lengthToM,
  m2To,
  paTo,
  stressFromForce,
  stressToPa,
} from './units';

describe('conversiones', () => {
  it('fuerza', () => {
    expect(forceToN(5, 'kN')).toBe(5000);
    expect(forceToN(250, 'N')).toBe(250);
  });

  it('esfuerzo', () => {
    expect(stressToPa(45, 'MPa')).toBe(45e6);
    expect(stressToPa(1.2, 'GPa')).toBeCloseTo(1.2e9, 0);
    expect(paTo(82.73e6, 'MPa')).toBeCloseTo(82.73, 10);
  });

  it('longitud y área', () => {
    expect(lengthToM(10, 'mm')).toBeCloseTo(0.01, 15);
    expect(areaToM2(1, 'cm²')).toBeCloseTo(1e-4, 15);
    expect(m2To(1e-6, 'mm²')).toBeCloseTo(1, 12);
  });

  it('rechaza valores no numéricos', () => {
    expect(() => forceToN(Number.NaN, 'N')).toThrow();
  });
});

describe('esfuerzo aplicado σ = F / A₀', () => {
  it('A₀ = π d² / 4: d = 10 mm → A₀ ≈ 78.54 mm²', () => {
    expect(m2To(circularArea(lengthToM(10, 'mm')), 'mm²')).toBeCloseTo(78.5398, 4);
  });

  it('F = 5 kN sobre d = 10 mm → σ ≈ 63.66 MPa', () => {
    const sigma = stressFromForce(forceToN(5, 'kN'), circularArea(lengthToM(10, 'mm')));
    expect(paTo(sigma, 'MPa')).toBeCloseTo(63.662, 3);
  });

  it('rechaza áreas o diámetros nulos o negativos', () => {
    expect(() => circularArea(0)).toThrow();
    expect(() => circularArea(-1)).toThrow();
    expect(() => stressFromForce(100, 0)).toThrow();
  });
});

describe('formato', () => {
  it('unidad legible', () => {
    expect(bestStressUnit(2.5e9)).toBe('GPa');
    expect(bestStressUnit(45e6)).toBe('MPa');
    expect(bestStressUnit(500)).toBe('Pa');
  });

  it('cifras significativas y signo menos tipográfico', () => {
    expect(formatNumber(0.408248290463863)).toBe('0.4082');
    expect(formatNumber(-22.0287)).toBe('−22.03');
    expect(formatNumber(Infinity)).toBe('∞');
    expect(formatNumber(5.2e-17)).toBe('0');
    expect(formatStress(45e6)).toBe('45 MPa');
  });
});
