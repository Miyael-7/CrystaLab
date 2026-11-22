import { describe, expect, it } from 'vitest';
import { acuteTo, applyMat, arcPoints, cylinderSection, det3, slipOffset, specimenRotation, vectorsFromAngles } from './specimen';
import { schmidFactor } from './slip';
import { acuteAngleBetweenDeg, angleBetweenDeg, dot, norm, normalize, type Vec3 } from './vector';

const close = (a: Vec3, b: Vec3, d = 9) => a.forEach((x, i) => expect(x).toBeCloseTo(b[i]!, d));

describe('rotación cristal → probeta', () => {
  const cases: [Vec3, Vec3, Vec3][] = [
    [[1, 0, 0], [1, 1, 1], [1, -1, 0]],
    [[1, 2, 1], [1, 1, 0], [-1, 1, 1]],
    [[1, 2, 3], [1, 0, 1], [1, -1, -1]],
    [[-2, 1, -3], [1, 1, 1], [0, 1, -1]],
    [[0, 0, 1], [0, 0, 1], [1, 0, 0]], // normal paralela a la carga
  ];

  it.each(cases)('carga %j: matriz ortonormal con det = +1 y carga → +z', (load, n, d) => {
    const R = specimenRotation(load, n, d);
    expect(det3(R)).toBeCloseTo(1, 12);
    R.forEach((row) => expect(norm(row)).toBeCloseTo(1, 12));
    expect(dot(R[0], R[1])).toBeCloseTo(0, 12);
    close(applyMat(R, normalize(load)), [0, 0, 1]);
  });

  it.each(cases)('carga %j: la rotación conserva φ y λ (y por lo tanto m)', (load, n, d) => {
    const R = specimenRotation(load, n, d);
    const z: Vec3 = [0, 0, 1];
    const s = schmidFactor(n as [number, number, number], d as [number, number, number], load);
    expect(angleBetweenDeg(z, applyMat(R, n))).toBeCloseTo(s.phiDeg, 9);
    expect(angleBetweenDeg(z, applyMat(R, d))).toBeCloseTo(s.lambdaDeg, 9);
  });

  it('la parte horizontal de la normal queda hacia +y', () => {
    const R = specimenRotation([1, 2, 1], [1, 1, 0], [-1, 1, 1]);
    const ns = applyMat(R, normalize([1, 1, 0]));
    expect(ns[0]).toBeCloseTo(0, 12);
    expect(ns[1]).toBeGreaterThan(0);
  });
});

describe('arcos de ángulo', () => {
  it('empiezan y terminan en las direcciones, con radio constante', () => {
    const a: Vec3 = [0, 0, 1];
    const b: Vec3 = normalize([0, 1, 1]);
    const pts = arcPoints(a, b, 0.5);
    close(pts[0]!, [0, 0, 0.5]);
    close(pts[pts.length - 1]!, [0, 0.5 / Math.SQRT2, 0.5 / Math.SQRT2]);
    pts.forEach((p) => expect(norm(p)).toBeCloseTo(0.5, 9));
  });

  it('el punto medio está a la mitad del ángulo', () => {
    const pts = arcPoints([0, 0, 1], [0, 1, 0], 1, 32);
    expect(angleBetweenDeg([0, 0, 1], pts[16]!)).toBeCloseTo(45, 9);
  });

  it('acuteTo invierte un vector que forma ángulo obtuso', () => {
    close(acuteTo([0, 0, -1], [0, 0, 1]), [0, 0, 1]);
    close(acuteTo([0, 1, 1], [0, 0, 1]), [0, 1, 1]);
  });
});

describe('sección del plano de deslizamiento en la probeta', () => {
  const R = 0.55;
  const h = 1.5;

  it('plano inclinado: elipse sobre la superficie del cilindro y sobre el plano', () => {
    const n = normalize([0, Math.sin(0.6), Math.cos(0.6)]);
    const poly = cylinderSection(n, R, h);
    expect(poly.length).toBeGreaterThan(40);
    poly.forEach((p) => {
      expect(dot(n, p)).toBeCloseTo(0, 9);
      expect(Math.hypot(p[0], p[1])).toBeCloseTo(R, 9);
      expect(Math.abs(p[2])).toBeLessThanOrEqual(h + 1e-9);
    });
  });

  it('plano muy inclinado (φ = 80°): se recorta con las tapas y no sale de la probeta', () => {
    const phi = (80 * Math.PI) / 180;
    const n: Vec3 = [0, Math.sin(phi), Math.cos(phi)];
    const poly = cylinderSection(n, R, h);
    poly.forEach((p) => {
      expect(dot(n, p)).toBeCloseTo(0, 9);
      expect(Math.abs(p[2])).toBeLessThanOrEqual(h + 1e-9);
      expect(Math.hypot(p[0], p[1])).toBeLessThanOrEqual(R + 1e-9);
    });
    expect(poly.some((p) => Math.abs(Math.abs(p[2]) - h) < 1e-9)).toBe(true);
  });

  it('plano vertical (φ = 90°): rectángulo que contiene al eje', () => {
    const poly = cylinderSection([0, 1, 0], R, h);
    expect(poly).toHaveLength(4);
    poly.forEach((p) => expect(p[1]).toBeCloseTo(0, 12));
  });
});

describe('vectores a partir de φ y λ', () => {
  it.each<[number, number]>([[38, 62], [43.1, 47.9], [45, 45], [28.1, 62.4], [60, 70], [0, 90], [90, 30]])(
    'φ = %s°, λ = %s°: reproduce los ángulos y n̂ ⊥ d̂',
    (phi, lam) => {
      const v = vectorsFromAngles(phi, lam)!;
      expect(v === null).toBe(false);
      expect(acuteAngleBetweenDeg([0, 0, 1], v.n)).toBeCloseTo(phi, 9);
      expect(acuteAngleBetweenDeg([0, 0, 1], v.d)).toBeCloseTo(lam, 9);
      expect(dot(v.n, v.d)).toBeCloseTo(0, 12);
    },
  );

  it('devuelve null si φ + λ < 90° (orientación imposible)', () => {
    expect(vectorsFromAngles(32.5, 56.8)).toBe(null);
    expect(vectorsFromAngles(0, 45)).toBe(null);
  });
});

describe('animación del deslizamiento', () => {
  const d: Vec3 = normalize([1, 0, 1]);
  const n: Vec3 = normalize([-1, 0, 1]);

  it('el desplazamiento está en el plano (⊥ n̂): el plano no se mueve', () => {
    expect(dot(slipOffset(d, 1, 0.7, 0.3), n)).toBeCloseTo(0, 12);
  });

  it('tensión → +d̂, compresión → −d̂; magnitud proporcional al progreso', () => {
    close(slipOffset(d, 1, 1, 0.3), [0.3 / Math.SQRT2, 0, 0.3 / Math.SQRT2]);
    close(slipOffset(d, -1, 1, 0.3), [-0.3 / Math.SQRT2, 0, -0.3 / Math.SQRT2]);
    expect(norm(slipOffset(d, 1, 0.5, 0.3))).toBeCloseTo(0.15, 12);
    expect(norm(slipOffset(d, 1, 2, 0.3))).toBeCloseTo(0.3, 12); // se limita a [0, 1]
  });
});
