/**
 * Validación con ejercicios resueltos de fuentes externas (no de las
 * presentaciones del curso). Cada caso indica su fuente; ver docs/validacion.md.
 */
import { describe, expect, it } from 'vitest';
import { parseIndices, planeDrawing, rankSlipSystems, resolvedShearStress, schmidFactor, schmidFromAngles, stressToActivate } from '../core';
import { computeSchmid, DEFAULT_INPUTS } from './schmidModel';

describe('Callister, ejemplo resuelto: Fe BCC con tensión en [010]', () => {
  // (110)[1̄11], σ = 52 MPa → τR = 52·(1/√2)(1/√3) = 21.2 MPa; con τCRSS = 30 MPa → σy = 73.4 MPa
  const s = schmidFactor([1, 1, 0], [-1, 1, 1], [0, 1, 0]);
  it('cos φ = 1/√2 y cos λ = 1/√3 (φ = 45°, λ = 54.7°)', () => {
    expect(s.cosPhi).toBeCloseTo(1 / Math.SQRT2, 12);
    expect(s.cosLambda).toBeCloseTo(1 / Math.sqrt(3), 12);
    expect(s.phiAcuteDeg).toBeCloseTo(45, 9);
    expect(s.lambdaAcuteDeg).toBeCloseTo(54.7356, 4);
  });
  it('τR = 21.2 MPa con σ = 52 MPa', () => {
    expect(resolvedShearStress(52, s.mAbs)).toBeCloseTo(21.23, 2);
  });
  it('σ para iniciar la fluencia con τCRSS = 30 MPa: 73.4 MPa', () => {
    expect(stressToActivate(30, s.m)).toBeCloseTo(73.48, 2);
  });
  it('el simulador completo da el mismo resultado', () => {
    const r = computeSchmid({ ...DEFAULT_INPUTS, plane: [1, 1, 0], dir: [-1, 1, 1], load: [0, 1, 0], stress: 52, crss: 30 });
    expect(r.tauPa! / 1e6).toBeCloseTo(21.23, 2);
    expect(r.sigmaToActivatePa! / 1e6).toBeCloseTo(73.48, 2);
    expect(r.state).toBe('inactive');
  });
});

describe('Callister 7.12: φ = 60°, λ = 35°, τCRSS = 6.2 MPa, σ = 12 MPa', () => {
  const r = schmidFromAngles(60, 35);
  it('τR = 4.9 MPa < 6.2 MPa → no fluye; se requieren 15.1 MPa', () => {
    expect(resolvedShearStress(12, r.m)).toBeCloseTo(4.91, 2);
    expect(6.2 / r.m).toBeCloseTo(15.14, 2);
    expect(r.geometricallyPossible).toBe(true);
  });
});

describe('Callister 7.13 (zinc): φ = 65°; λ = 30°, 48° y 78°; σ = 2.5 MPa', () => {
  const ms = [30, 48, 78].map((l) => schmidFromAngles(65, l).m);
  it('la dirección más favorable es la de 30°', () => {
    expect(ms.indexOf(Math.max(...ms))).toBe(0);
  });
  it('τCRSS = 2.5 × cos 65° × cos 30° = 0.91 MPa', () => {
    expect(resolvedShearStress(2.5, ms[0]!)).toBeCloseTo(0.915, 3);
  });
});

describe('Callister 7.14 (níquel): tensión en [001], (111)[1̄01], σ = 13.9 MPa', () => {
  it('τCRSS = 13.9 × (1/√3)(1/√2) = 5.68 MPa', () => {
    const s = schmidFactor([1, 1, 1], [-1, 0, 1], [0, 0, 1]);
    expect(resolvedShearStress(13.9, s.mAbs)).toBeCloseTo(5.675, 3);
  });
});

describe('Callister 7.15: FCC, tensión en [100], τCRSS = 0.5 MPa, plano (111)', () => {
  it('[1̄01] y [1̄10]: σ = 1.22 MPa; [01̄1]: λ = 90°, no puede deslizar', () => {
    const load: [number, number, number] = [1, 0, 0];
    expect(stressToActivate(0.5, schmidFactor([1, 1, 1], [-1, 0, 1], load).m)).toBeCloseTo(1.2247, 4);
    expect(stressToActivate(0.5, schmidFactor([1, 1, 1], [-1, 1, 0], load).m)).toBeCloseTo(1.2247, 4);
    expect(schmidFactor([1, 1, 1], [0, -1, 1], load).lambdaAcuteDeg).toBeCloseTo(90, 9);
    expect(stressToActivate(0.5, schmidFactor([1, 1, 1], [0, -1, 1], load).m)).toBe(Infinity);
  });
  it('una dirección como [101] no pertenece a (111) y el simulador la rechaza', () => {
    const r = computeSchmid({ ...DEFAULT_INPUTS, plane: [1, 1, 1], dir: [1, 0, 1], load: [1, 0, 0] });
    expect(r.errors.some((e) => /no es un sistema de deslizamiento válido/.test(e))).toBe(true);
  });
});

describe('Universidad de Texas en Austin: BCC {110}<111> con tensión en [123] (factores con signo)', () => {
  // Tabla publicada: (110)[1̄11] 0.56695 · 0.61721 = 0.34993; (110)[11̄1] 0.56695 · 0.30861 = 0.17496;
  // (11̄0)[111] −0.18898 · 0.92582 = −0.17496; (11̄0)[1̄1̄1] → 0
  const load: [number, number, number] = [1, 2, 3];
  it.each<[[number, number, number], [number, number, number], number, number, number]>([
    [[1, 1, 0], [-1, 1, 1], 0.56695, 0.61721, 0.34993],
    [[1, 1, 0], [1, -1, 1], 0.56695, 0.30861, 0.17496],
    [[1, -1, 0], [1, 1, 1], -0.18898, 0.92582, -0.17496],
    [[1, -1, 0], [-1, -1, 1], -0.18898, 0, 0],
  ])('%j%j: cos φ = %s, cos λ = %s, m = %s', (plane, dir, cp, cl, m) => {
    const s = schmidFactor(plane, dir, load);
    expect(s.cosPhi).toBeCloseTo(cp, 5);
    expect(s.cosLambda).toBeCloseTo(cl, 5);
    expect(s.m).toBeCloseTo(m, 5);
  });
  it('el comparador encuentra el mismo sistema primario que la literatura: m = 0.467', () => {
    expect(rankSlipSystems('BCC', load)[0]!.schmid.mAbs).toBeCloseTo(0.4666, 4);
  });
});

describe('NPTEL (IIT): direcciones contenidas en el plano (111)', () => {
  it('[1̄10], [01̄1], [1̄01] cumplen hu + kv + lw = 0', () => {
    for (const d of [[-1, 1, 0], [0, -1, 1], [-1, 0, 1]] as const) {
      expect(1 * d[0] + 1 * d[1] + 1 * d[2]).toBe(0);
    }
  });
});

describe('Índices de Miller de un plano: intersecciones x = ∞, y = −1, z = 1/2 → (01̄2)', () => {
  it('el plano (01̄2) reproduce esas intersecciones desde el origen trasladado (0,1,0)', () => {
    const r = parseIndices('0 -1 2');
    expect(r.ok).toBe(true);
    const g = planeDrawing([0, -1, 2]);
    expect(g.origin).toEqual([0, 1, 0]);
    expect(g.intercepts[0]).toBe(Infinity);
    expect(g.intercepts[1]).toBeCloseTo(-1, 12);
    expect(g.intercepts[2]).toBeCloseTo(0.5, 12);
  });
});
