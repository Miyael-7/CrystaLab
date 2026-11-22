/**
 * Operaciones vectoriales en 3D.
 *
 * En un cristal cúbico los ejes cristalográficos son ortogonales y de igual
 * longitud, así que un índice [uvw] o (hkl) se trata directamente como un
 * vector cartesiano (u, v, w). Los ángulos no dependen del parámetro de red.
 */

export type Vec3 = readonly [number, number, number];

/** Tolerancia numérica para comparaciones con cero. */
export const EPS = 1e-9;

export const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const negate = (a: Vec3): Vec3 => [-a[0], -a[1], -a[2]];

export const norm = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);

/** Vector unitario. Lanza un error si el vector es nulo (no tiene dirección). */
export function normalize(a: Vec3): Vec3 {
  const n = norm(a);
  if (n < EPS) throw new Error('El vector nulo no tiene dirección y no puede normalizarse.');
  return [a[0] / n, a[1] / n, a[2] / n];
}

/** Limita x al intervalo [min, max]. Evita NaN en acos por errores de redondeo. */
export const clamp = (x: number, min: number, max: number): number => Math.min(max, Math.max(min, x));

export const degToRad = (deg: number): number => (deg * Math.PI) / 180;
export const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

/** Coseno del ángulo entre a y b (con signo), calculado con vectores normalizados. */
export function cosBetween(a: Vec3, b: Vec3): number {
  const c = clamp(dot(normalize(a), normalize(b)), -1, 1);
  // Ruido de redondeo (≈1e-17) en vectores perpendiculares → cero exacto.
  return Math.abs(c) < 1e-12 ? 0 : c;
}

/** Ángulo entre los vectores a y b, en grados, en el intervalo [0°, 180°]. */
export function angleBetweenDeg(a: Vec3, b: Vec3): number {
  return radToDeg(Math.acos(cosBetween(a, b)));
}

/**
 * Ángulo entre las RECTAS que contienen a y b, en grados, en [0°, 90°].
 * Es el que se usa en clase: una normal o una dirección y su opuesta
 * definen la misma recta.
 */
export function acuteAngleBetweenDeg(a: Vec3, b: Vec3): number {
  return radToDeg(Math.acos(Math.abs(cosBetween(a, b))));
}

/** Determinante [a b c] (producto mixto a · (b × c)). Es cero si los tres son coplanares. */
export const tripleProduct = (a: Vec3, b: Vec3, c: Vec3): number => dot(a, cross(b, c));
