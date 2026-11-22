import { describe, expect, it } from 'vitest';
import {
  activationState,
  isDirectionInPlane,
  resolvedShearStress,
  schmidFactor,
  schmidFromAngles,
  signedStress,
  stressToActivate,
  validateSlipSystem,
} from './slip';
import type { Vec3 } from './vector';

const INV_SQRT6 = 1 / Math.sqrt(6); // 0.40825

describe('pertenencia de la dirección al plano: hu + kv + lw = 0', () => {
  it('sistemas válidos e inválidos', () => {
    expect(isDirectionInPlane([1, 1, 1], [1, -1, 0])).toBe(true);
    expect(isDirectionInPlane([1, 1, 0], [-1, 1, 1])).toBe(true);
    expect(isDirectionInPlane([1, 1, 1], [1, 0, 0])).toBe(false);
  });

  it('un sistema inválido produce un mensaje explicativo', () => {
    const v = validateSlipSystem([1, 1, 1], [1, 1, 0], [1, 0, 0]);
    expect(v.ok).toBe(false);
    expect(v.errors[0]).toMatch(/no es un sistema de deslizamiento válido/);
    expect(() => schmidFactor([1, 1, 1], [1, 1, 0], [1, 0, 0])).toThrow();
  });

  it('rechaza una dirección de esfuerzo nula', () => {
    expect(validateSlipSystem([1, 1, 1], [1, -1, 0], [0, 0, 0]).ok).toBe(false);
  });
});

describe('ejemplos de clase con índices', () => {
  // Ley de Schmid 2: FCC con [100] paralelo al esfuerzo, plano (111), dirección [11̄0].
  it('FCC, eje [100], (111)[11̄0] → m = 1/√6 ≈ 0.408', () => {
    const r = schmidFactor([1, 1, 1], [1, -1, 0], [1, 0, 0]);
    expect(r.phiAcuteDeg).toBeCloseTo(54.7356, 4);
    expect(r.lambdaAcuteDeg).toBeCloseTo(45, 10);
    expect(r.mAbs).toBeCloseTo(INV_SQRT6, 12);
    expect(r.mAbs).toBeCloseTo(0.408, 3);
  });

  // Ley de Schmid 2: BCC, eje [121], (110)[1̄11], τCRSS = 82.73 MPa.
  it('BCC, eje [121], (110)[1̄11] → m ≈ 0.408 y σ ≈ 202.6 MPa para iniciar el deslizamiento', () => {
    const r = schmidFactor([1, 1, 0], [-1, 1, 1], [1, 2, 1]);
    expect(r.phiAcuteDeg).toBeCloseTo(30, 10);
    expect(r.lambdaAcuteDeg).toBeCloseTo(61.8745, 4);
    expect(r.mAbs).toBeCloseTo(INV_SQRT6, 12);
    expect(stressToActivate(82.73, r.m)).toBeCloseTo(202.65, 2);
  });

  it('el resultado no depende de la escala de los índices: [242] ≡ [121]', () => {
    const a = schmidFactor([1, 1, 0], [-1, 1, 1], [1, 2, 1]);
    const b = schmidFactor([2, 2, 0], [-2, 2, 2], [2, 4, 2]);
    expect(b.m).toBeCloseTo(a.m, 12);
  });

  it('φ + λ ≥ 90° siempre (ángulos agudos), aunque no sumen 90° en general', () => {
    const r = schmidFactor([1, 1, 0], [-1, 1, 1], [1, 2, 1]);
    expect(r.phiAcuteDeg + r.lambdaAcuteDeg).toBeGreaterThan(90);
    expect(r.coplanarCase).toBe(false);
  });
});

describe('caso especial: eje de carga en el plano de n̂ y d̂', () => {
  it('(101)[1̄01] con carga [100]: φ = λ = 45°, |m| = 0.5 (máximo)', () => {
    const r = schmidFactor([1, 0, 1], [-1, 0, 1], [1, 0, 0]);
    expect(r.coplanarCase).toBe(true);
    expect(r.phiAcuteDeg).toBeCloseTo(45, 10);
    expect(r.lambdaAcuteDeg).toBeCloseTo(45, 10);
    expect(r.mAbs).toBeCloseTo(0.5, 12);
  });

  it('|m| nunca supera 0.5 (1000 orientaciones de carga)', () => {
    let seed = 12345;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648) * 2 - 1;
    for (let i = 0; i < 1000; i++) {
      const load: Vec3 = [rand(), rand(), rand()];
      if (Math.hypot(...load) < 1e-3) continue;
      expect(schmidFactor([1, 1, 1], [1, -1, 0], load).mAbs).toBeLessThanOrEqual(0.5 + 1e-12);
    }
  });
});

describe('signos: tensión y compresión', () => {
  it('σ es positivo en tensión y negativo en compresión', () => {
    expect(signedStress(45, 'tension')).toBe(45);
    expect(signedStress(45, 'compression')).toBe(-45);
    expect(() => signedStress(-5, 'tension')).toThrow();
  });

  it('cambiar a compresión invierte el signo de τR pero no su magnitud', () => {
    const { m } = schmidFactor([1, 1, 1], [1, -1, 0], [1, 0, 0]);
    const t = resolvedShearStress(signedStress(100, 'tension'), m);
    const c = resolvedShearStress(signedStress(100, 'compression'), m);
    expect(c).toBeCloseTo(-t, 12);
    expect(Math.abs(c)).toBeCloseTo(Math.abs(t), 12);
  });

  it('invertir el sentido de la dirección de deslizamiento invierte el signo de m', () => {
    const a = schmidFactor([1, 1, 1], [1, -1, 0], [1, 0, 0]);
    const b = schmidFactor([1, 1, 1], [-1, 1, 0], [1, 0, 0]);
    expect(b.m).toBeCloseTo(-a.m, 12);
    expect(b.lambdaDeg).toBeCloseTo(180 - a.lambdaDeg, 10);
  });

  it('m = 0 cuando el eje de carga es perpendicular a la dirección de deslizamiento', () => {
    const r = schmidFactor([1, 1, 1], [0, 1, -1], [1, 0, 0]);
    expect(r.mAbs).toBeCloseTo(0, 12);
    expect(stressToActivate(10, r.m)).toBe(Infinity);
  });
});

describe('calculadora por ángulos (ejercicios de clase)', () => {
  it('φ = 43.1°, λ = 47.9°, σ = 45 MPa, τCRSS = 20.7 MPa → τR ≈ 22.0 MPa: sí desliza', () => {
    const r = schmidFromAngles(43.1, 47.9);
    expect(r.geometricallyPossible).toBe(true);
    expect(r.m).toBeCloseTo(0.4895, 4);
    const tau = resolvedShearStress(45, r.m);
    expect(tau).toBeCloseTo(22.03, 2);
    expect(activationState(tau, 20.7)).toBe('active');
  });

  it('monocristal de Al: φ = 28.1°; de 62.4°, 72.0° y 81.1° la más favorable es 62.4°', () => {
    const ms = [62.4, 72.0, 81.1].map((l) => schmidFromAngles(28.1, l).m);
    expect(ms.indexOf(Math.max(...ms))).toBe(0);
    ms.forEach((m) => expect(m).toBeGreaterThan(0));
    // τCRSS = σ·m con σ = 1.95 MPa
    expect(resolvedShearStress(1.95, ms[0]!)).toBeCloseTo(0.797, 3);
    [62.4, 72.0, 81.1].forEach((l) => expect(schmidFromAngles(28.1, l).geometricallyPossible).toBe(true));
  });

  it('advierte cuando φ + λ < 90° (orientación imposible)', () => {
    const r = schmidFromAngles(32.5, 56.8);
    expect(r.geometricallyPossible).toBe(false);
    expect(r.warnings).toHaveLength(1);
  });

  it('φ + λ = 90° se identifica como caso coplanar; 45°/45° da m = 0.5', () => {
    const r = schmidFromAngles(45, 45);
    expect(r.coplanarCase).toBe(true);
    expect(r.m).toBeCloseTo(0.5, 12);
  });

  it('rechaza ángulos fuera de [0°, 90°]', () => {
    expect(() => schmidFromAngles(-1, 60)).toThrow();
    expect(() => schmidFromAngles(30, 95)).toThrow();
    expect(() => schmidFromAngles(Number.NaN, 60)).toThrow();
  });
});

describe('estado de activación |τR| frente a τCRSS', () => {
  it('no activado, próximo y activado', () => {
    expect(activationState(10, 20)).toBe('inactive');
    expect(activationState(18, 20)).toBe('near'); // 90 %
    expect(activationState(20, 20)).toBe('active'); // igualdad = inicio del deslizamiento
    expect(activationState(-25, 20)).toBe('active'); // se compara la magnitud
  });

  it('umbral configurable y validaciones', () => {
    expect(activationState(15, 20, 0.75)).toBe('near');
    expect(() => activationState(10, 0)).toThrow();
    expect(() => activationState(10, 20, 1.5)).toThrow();
  });
});
