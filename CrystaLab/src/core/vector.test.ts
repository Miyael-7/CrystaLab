import { describe, expect, it } from 'vitest';
import {
  acuteAngleBetweenDeg,
  angleBetweenDeg,
  cosBetween,
  cross,
  degToRad,
  dot,
  norm,
  normalize,
  radToDeg,
  tripleProduct,
} from './vector';

describe('operaciones vectoriales', () => {
  it('producto punto y producto cruz', () => {
    expect(dot([1, 2, 3], [4, -5, 6])).toBe(12);
    expect(cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
    expect(dot(cross([1, 2, 3], [4, 5, 6]), [1, 2, 3])).toBe(0);
  });

  it('norma y normalización', () => {
    expect(norm([3, 4, 0])).toBe(5);
    const u = normalize([1, 1, 1]);
    expect(norm(u)).toBeCloseTo(1, 12);
    expect(u[0]).toBeCloseTo(1 / Math.sqrt(3), 12);
  });

  it('el vector nulo no se puede normalizar', () => {
    expect(() => normalize([0, 0, 0])).toThrow();
  });

  it('la normalización no cambia el ángulo: [222] y [111] son la misma dirección', () => {
    expect(angleBetweenDeg([2, 2, 2], [1, 1, 1])).toBeCloseTo(0, 6);
  });

  it('conversión grados ↔ radianes', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 12);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90, 12);
    expect(radToDeg(degToRad(37.25))).toBeCloseTo(37.25, 12);
  });

  it('ángulos conocidos en un cristal cúbico', () => {
    expect(angleBetweenDeg([1, 0, 0], [1, 1, 0])).toBeCloseTo(45, 10);
    expect(angleBetweenDeg([1, 0, 0], [1, 1, 1])).toBeCloseTo(54.7356, 4);
    expect(angleBetweenDeg([1, 1, 1], [1, -1, 0])).toBeCloseTo(90, 10);
    expect(angleBetweenDeg([1, 0, 0], [-1, 0, 0])).toBeCloseTo(180, 10);
  });

  it('ángulo entre rectas: siempre agudo', () => {
    expect(acuteAngleBetweenDeg([1, 0, 0], [-1, -1, 0])).toBeCloseTo(45, 10);
    expect(acuteAngleBetweenDeg([1, 0, 0], [-1, 0, 0])).toBeCloseTo(0, 6);
  });

  it('el coseno se limita a [-1, 1] (sin NaN por redondeo)', () => {
    const c = cosBetween([1e-8, 1, 1e-8], [1e-8, 1, 1e-8]);
    expect(c).toBeLessThanOrEqual(1);
    expect(Number.isNaN(angleBetweenDeg([0.1, 0.2, 0.3], [0.1, 0.2, 0.3]))).toBe(false);
  });

  it('vectores perpendiculares: coseno exactamente 0 y ángulo exactamente 90°', () => {
    expect(cosBetween([0, 1, 1], [1, 1, -1])).toBe(0);
    expect(angleBetweenDeg([1, 2, 3], [1, 1, -1])).toBe(90);
  });

  it('producto mixto: cero para vectores coplanares', () => {
    expect(tripleProduct([1, 0, 0], [0, 1, 0], [1, 1, 0])).toBe(0);
    expect(tripleProduct([1, 0, 0], [0, 1, 0], [0, 0, 1])).toBe(1);
  });
});
