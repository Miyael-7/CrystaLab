import { describe, expect, it } from 'vitest';
import { acuteAngleBetweenDeg } from '../core';
import { computeSchmid, DEFAULT_INPUTS, inUnit, type SchmidInputs } from './schmidModel';

const make = (p: Partial<SchmidInputs>): SchmidInputs => ({ ...DEFAULT_INPUTS, ...p });

describe('modelo del simulador de Schmid', () => {
  it('BCC [121] (110)[1̄11], τCRSS = 82.73 MPa: σ para activar ≈ 202.6 MPa', () => {
    const r = computeSchmid(make({ stressMode: 'stress', stress: 180 }));
    expect(r.errors).toHaveLength(0);
    expect(r.phiDeg!).toBeCloseTo(30, 9);
    expect(r.m!).toBeCloseTo(0.4082, 4);
    expect(inUnit(r.sigmaToActivatePa, 'MPa')!).toBeCloseTo(202.65, 2);
    expect(r.state).toBe('inactive'); // 180 × 0.408 = 73.5 MPa = 88.8 % de τCRSS (< 90 %)
  });

  it('estado según |τR|/τCRSS', () => {
    const at = (stress: number) => computeSchmid(make({ stressMode: 'stress', stress }));
    expect(at(150).state).toBe('inactive'); // 61.2 / 82.73 = 74 %
    expect(at(190).state).toBe('near'); // 77.6 / 82.73 = 94 %
    expect(at(210).state).toBe('active'); // 85.7 ≥ 82.73
  });

  it('fuerza y diámetro: F = 5 kN, d = 10 mm → σ ≈ 63.66 MPa', () => {
    const r = computeSchmid(make({ stressMode: 'force', force: 5, forceUnit: 'kN', areaMode: 'diameter', diameter: 10, diameterUnit: 'mm' }));
    expect(inUnit(r.sigmaPa, 'MPa')!).toBeCloseTo(63.662, 3);
    expect(r.areaM2! * 1e6).toBeCloseTo(78.54, 2);
  });

  it('fuerza y área directa dan el mismo σ', () => {
    const r = computeSchmid(make({ stressMode: 'force', force: 5000, forceUnit: 'N', areaMode: 'area', area: 78.5398, areaUnit: 'mm²' }));
    expect(inUnit(r.sigmaPa, 'MPa')!).toBeCloseTo(63.662, 3);
  });

  it('compresión: σ y τR negativos, misma magnitud y mismo estado', () => {
    const t = computeSchmid(make({ stress: 210 }));
    const c = computeSchmid(make({ stress: 210, loadType: 'compression' }));
    expect(c.sigmaPa).toBeCloseTo(-t.sigmaPa!, 6);
    expect(c.tauPa).toBeCloseTo(-t.tauPa!, 6);
    expect(c.state).toBe(t.state);
    expect(c.vector!.upperSense).toBe(-t.vector!.upperSense);
  });

  it('sistema inválido: error explicativo y sin resultados', () => {
    const r = computeSchmid(make({ plane: [1, 1, 1], dir: [1, 1, 0] }));
    expect(r.errors.some((e) => /no es un sistema de deslizamiento válido/.test(e))).toBe(true);
    expect(r.m).toBe(null);
    expect(r.scene).toBe(null);
  });

  it('la escena 3D conserva los ángulos calculados', () => {
    const r = computeSchmid(make({ plane: [1, 1, 1], dir: [1, -1, 0], load: [1, 0, 0] }));
    expect(acuteAngleBetweenDeg([0, 0, 1], r.scene!.normal)).toBeCloseTo(r.phiDeg!, 9);
    expect(acuteAngleBetweenDeg([0, 0, 1], r.scene!.slip)).toBeCloseTo(r.lambdaDeg!, 9);
  });

  it('modo ángulos: ejercicio φ = 43.1°, λ = 47.9°, σ = 45 MPa, τCRSS = 20.7 MPa → activado', () => {
    const r = computeSchmid(make({ mode: 'angles', phi: 43.1, lambda: 47.9, stress: 45, crss: 20.7 }));
    expect(inUnit(r.tauPa, 'MPa')!).toBeCloseTo(22.03, 2);
    expect(r.state).toBe('active');
    expect(r.scene === null).toBe(false);
  });

  it('modo ángulos: orientación imposible → advertencia y sin escena 3D', () => {
    const r = computeSchmid(make({ mode: 'angles', phi: 32.5, lambda: 56.8, stress: 3 }));
    expect(r.geometricallyPossible).toBe(false);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.scene).toBe(null);
  });

  it('m = 0 produce una advertencia y σ para activar infinito', () => {
    const r = computeSchmid(make({ plane: [1, 1, 1], dir: [0, 1, -1], load: [1, 0, 0] }));
    expect(r.m!).toBeCloseTo(0, 12);
    expect(r.sigmaToActivatePa).toBe(Infinity);
    expect(r.warnings.some((w) => /m = 0/.test(w))).toBe(true);
  });

  it('valida entradas numéricas', () => {
    expect(computeSchmid(make({ crss: 0 })).errors.length).toBeGreaterThan(0);
    expect(computeSchmid(make({ stress: -5 })).errors.length).toBeGreaterThan(0);
    expect(computeSchmid(make({ stressMode: 'force', diameter: 0 })).errors.length).toBeGreaterThan(0);
    expect(computeSchmid(make({ load: [0, 0, 0] })).errors.length).toBeGreaterThan(0);
  });
});
